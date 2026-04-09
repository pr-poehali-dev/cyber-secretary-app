"""
Авторизация LexDesk: регистрация, вход, профиль, обновление профиля, выход.
Сессии хранятся в PostgreSQL. Пароли хешируются через hashlib (pbkdf2).
"""
import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p21225702_cyber_secretary_app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

def resp(body, status=200):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
    }

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"pbkdf2:sha256:{salt}:{dk.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        _, _, salt, dk_hex = stored.split(":")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
        return dk.hex() == dk_hex
    except Exception:
        return False

def get_user_by_token(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT u.id, u.email, u.full_name, u.notify_email, u.notify_days_before
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        return cur.fetchone()

def get_token(event: dict) -> str:
    auth = event.get("headers", {}).get("X-Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return ""

def handler(event: dict, context) -> dict:
    """Авторизация: register, login, me, update, logout."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/")

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # ── POST /register ────────────────────────────────────────────────────────
    if path == "/register" and method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        full_name = body.get("fullName", "").strip()

        if not email or not password:
            return resp({"error": "Email и пароль обязательны"}, 400)
        if len(password) < 6:
            return resp({"error": "Пароль должен быть не менее 6 символов"}, 400)
        if "@" not in email:
            return resp({"error": "Некорректный email"}, 400)

        pw_hash = hash_password(password)

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return resp({"error": "Пользователь с таким email уже существует"}, 409)

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.users (email, password_hash, full_name, notify_email)
                    VALUES (%s, %s, %s, %s) RETURNING id, email, full_name, notify_email, notify_days_before
                """, (email, pw_hash, full_name, email))
                user = dict(cur.fetchone())

                token = secrets.token_urlsafe(32)
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.sessions (user_id, token)
                    VALUES (%s, %s)
                """, (user["id"], token))
            conn.commit()

        return resp({"token": token, "user": user}, 201)

    # ── POST /login ───────────────────────────────────────────────────────────
    if path == "/login" and method == "POST":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return resp({"error": "Введите email и пароль"}, 400)

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"""
                    SELECT id, email, full_name, notify_email, notify_days_before, password_hash
                    FROM {SCHEMA}.users WHERE email = %s
                """, (email,))
                user = cur.fetchone()

            if not user or not verify_password(password, user["password_hash"]):
                return resp({"error": "Неверный email или пароль"}, 401)

            user = dict(user)
            pw_hash = user.pop("password_hash")

            token = secrets.token_urlsafe(32)
            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.sessions (user_id, token)
                    VALUES (%s, %s)
                """, (user["id"], token))
                cur.execute(f"""
                    UPDATE {SCHEMA}.users SET last_login_at = NOW() WHERE id = %s
                """, (user["id"],))
            conn.commit()

        return resp({"token": token, "user": user})

    # ── GET /me ───────────────────────────────────────────────────────────────
    if path == "/me" and method == "GET":
        token = get_token(event)
        if not token:
            return resp({"error": "Не авторизован"}, 401)

        with get_conn() as conn:
            user = get_user_by_token(conn, token)

        if not user:
            return resp({"error": "Сессия истекла, войдите снова"}, 401)

        return resp({"user": dict(user)})

    # ── PUT /me ───────────────────────────────────────────────────────────────
    if path == "/me" and method == "PUT":
        token = get_token(event)
        if not token:
            return resp({"error": "Не авторизован"}, 401)

        with get_conn() as conn:
            user = get_user_by_token(conn, token)
            if not user:
                return resp({"error": "Сессия истекла"}, 401)

            user_id = user["id"]
            full_name = body.get("fullName", user["full_name"]).strip()
            notify_email = body.get("notifyEmail", user["notify_email"]).strip()
            notify_days = body.get("notifyDaysBefore", user["notify_days_before"])

            # Смена пароля (опционально)
            new_password = body.get("newPassword", "")
            old_password = body.get("oldPassword", "")

            if new_password:
                if len(new_password) < 6:
                    return resp({"error": "Новый пароль должен быть не менее 6 символов"}, 400)
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"SELECT password_hash FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                    row = cur.fetchone()
                if not verify_password(old_password, row["password_hash"]):
                    return resp({"error": "Текущий пароль введён неверно"}, 400)

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if new_password:
                    pw_hash = hash_password(new_password)
                    cur.execute(f"""
                        UPDATE {SCHEMA}.users
                        SET full_name=%s, notify_email=%s, notify_days_before=%s, password_hash=%s
                        WHERE id=%s RETURNING id, email, full_name, notify_email, notify_days_before
                    """, (full_name, notify_email, notify_days, pw_hash, user_id))
                else:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.users
                        SET full_name=%s, notify_email=%s, notify_days_before=%s
                        WHERE id=%s RETURNING id, email, full_name, notify_email, notify_days_before
                    """, (full_name, notify_email, notify_days, user_id))
                updated = dict(cur.fetchone())
            conn.commit()

        return resp({"user": updated})

    # ── POST /logout ──────────────────────────────────────────────────────────
    if path == "/logout" and method == "POST":
        token = get_token(event)
        if token:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
        return resp({"ok": True})

    return resp({"error": "Not found"}, 404)
