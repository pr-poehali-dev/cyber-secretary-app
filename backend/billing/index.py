"""
Биллинг LexDesk: проверка подписки, панель администратора.
Эндпоинты:
  GET  /           — статус подписки текущего пользователя
  POST /request    — заявка на оплату (пользователь сообщает об оплате)
  GET  /settings   — публичные настройки оплаты (цена, срок, реквизиты)
  GET  /admin/users        — список всех пользователей (только admin)
  PUT  /admin/users/{id}   — изменить статус подписки пользователя (только admin)
  GET  /admin/settings     — получить настройки (только admin)
  PUT  /admin/settings     — обновить настройки (только admin)
"""
import json
import os
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p21225702_cyber_secretary_app"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

def resp(body, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False, default=str)}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_token(event):
    auth = event.get("headers", {}).get("X-Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return ""

def get_user(conn, token):
    if not token:
        return None
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT u.id, u.email, u.full_name, u.is_admin
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        return cur.fetchone()

def get_subscription(conn, user_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {SCHEMA}.subscriptions WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    if not row:
        # авто-создаём trial если вдруг нет
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.subscriptions(user_id, status, trial_started_at)
                VALUES (%s, 'trial', NOW()) ON CONFLICT (user_id) DO NOTHING RETURNING *
            """, (user_id,))
            row = cur.fetchone()
        conn.commit()
    return dict(row) if row else None

def compute_access(sub):
    """Возвращает dict: {has_access, days_left, status, expires_label}"""
    status = sub["status"]
    now = datetime.now(timezone.utc)

    if status == "free":
        return {"has_access": True, "status": "free", "days_left": None, "expires_label": "Бесплатный доступ"}

    if status == "blocked":
        return {"has_access": False, "status": "blocked", "days_left": 0, "expires_label": "Доступ заблокирован"}

    if status == "active":
        paid_until = sub.get("paid_until")
        if paid_until:
            if isinstance(paid_until, str):
                paid_until = datetime.fromisoformat(paid_until)
            days_left = (paid_until - now).days
            if days_left >= 0:
                return {"has_access": True, "status": "active", "days_left": days_left, "expires_label": f"Оплачено до {paid_until.strftime('%d.%m.%Y')}"}
        # paid_until истёк — падаем на trial
        status = "trial"

    # trial
    trial_started = sub.get("trial_started_at")
    if isinstance(trial_started, str):
        trial_started = datetime.fromisoformat(trial_started)
    trial_days = sub.get("trial_days", 10)
    elapsed = (now - trial_started).days
    days_left = max(0, trial_days - elapsed)
    if days_left > 0:
        return {"has_access": True, "status": "trial", "days_left": days_left, "expires_label": f"Пробный период: осталось {days_left} дн."}
    return {"has_access": False, "status": "trial_expired", "days_left": 0, "expires_label": "Пробный период истёк"}

def handler(event: dict, context) -> dict:
    """Биллинг и администрирование доступа пользователей."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/") or "/"
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = get_token(event)

    # ── GET / — статус подписки текущего пользователя ────────────────────────
    if path == "/" and method == "GET":
        with get_conn() as conn:
            user = get_user(conn, token)
            if not user:
                return resp({"error": "Не авторизован"}, 401)
            sub = get_subscription(conn, user["id"])
        access = compute_access(sub)
        return resp({**access, "is_admin": bool(user["is_admin"]), "subscription": sub})

    # ── GET /settings — публичные настройки оплаты ───────────────────────────
    if path == "/settings" and method == "GET":
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"SELECT price_rub, period_days, payment_info FROM {SCHEMA}.admin_settings WHERE id = 1")
                row = cur.fetchone()
        return resp(dict(row) if row else {"price_rub": 990, "period_days": 30, "payment_info": ""})

    # ── POST /request — пользователь сообщает об оплате ─────────────────────
    if path == "/request" and method == "POST":
        with get_conn() as conn:
            user = get_user(conn, token)
            if not user:
                return resp({"error": "Не авторизован"}, 401)
            sub = get_subscription(conn, user["id"])
            note = sub.get("note", "")
            new_note = f"{note}\n[{datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M')}] Пользователь сообщил об оплате: {body.get('comment', '')}".strip()
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.subscriptions SET note = %s, updated_at = NOW() WHERE user_id = %s", (new_note, user["id"]))
            conn.commit()
        return resp({"ok": True})

    # ── Только для администраторов ────────────────────────────────────────────
    if path.startswith("/admin"):
        with get_conn() as conn:
            user = get_user(conn, token)
        if not user or not user["is_admin"]:
            return resp({"error": "Доступ запрещён"}, 403)

        # GET /admin/users
        if path == "/admin/users" and method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        SELECT u.id, u.email, u.full_name, u.is_admin, u.created_at,
                               s.status, s.trial_started_at, s.trial_days,
                               s.paid_until, s.note, s.updated_at as sub_updated
                        FROM {SCHEMA}.users u
                        LEFT JOIN {SCHEMA}.subscriptions s ON s.user_id = u.id
                        ORDER BY u.created_at DESC
                    """)
                    rows = cur.fetchall()
            result = []
            for r in rows:
                r = dict(r)
                access = compute_access(r) if r.get("status") else {"has_access": False, "status": "no_sub", "days_left": 0, "expires_label": ""}
                r["access"] = access
                result.append(r)
            return resp(result)

        # PUT /admin/users/{id}
        if path.startswith("/admin/users/") and method == "PUT":
            uid = int(path.split("/")[-1])
            status = body.get("status")           # trial|active|blocked|free
            paid_until = body.get("paid_until")   # ISO date string или null
            note = body.get("note")
            trial_days = body.get("trial_days")
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    fields = ["updated_at = NOW()"]
                    vals = []
                    if status is not None:
                        fields.append("status = %s"); vals.append(status)
                    if paid_until is not None:
                        fields.append("paid_until = %s"); vals.append(paid_until if paid_until else None)
                    if note is not None:
                        fields.append("note = %s"); vals.append(note)
                    if trial_days is not None:
                        fields.append("trial_days = %s"); vals.append(int(trial_days))
                    vals.append(uid)
                    cur.execute(f"UPDATE {SCHEMA}.subscriptions SET {', '.join(fields)} WHERE user_id = %s RETURNING *", vals)
                    row = cur.fetchone()
                    if not row:
                        # создаём если нет
                        cur.execute(f"INSERT INTO {SCHEMA}.subscriptions(user_id, status) VALUES(%s, %s) RETURNING *", (uid, status or 'trial'))
                        row = cur.fetchone()
                conn.commit()
            return resp(dict(row))

        # GET /admin/settings
        if path == "/admin/settings" and method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"SELECT * FROM {SCHEMA}.admin_settings WHERE id = 1")
                    row = cur.fetchone()
            return resp(dict(row))

        # PUT /admin/settings
        if path == "/admin/settings" and method == "PUT":
            price = body.get("price_rub")
            period = body.get("period_days")
            payment_info = body.get("payment_info")
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    fields = ["updated_at = NOW()"]
                    vals = []
                    if price is not None:
                        fields.append("price_rub = %s"); vals.append(int(price))
                    if period is not None:
                        fields.append("period_days = %s"); vals.append(int(period))
                    if payment_info is not None:
                        fields.append("payment_info = %s"); vals.append(payment_info)
                    cur.execute(f"UPDATE {SCHEMA}.admin_settings SET {', '.join(fields)} WHERE id = 1 RETURNING *", vals)
                    row = cur.fetchone()
                conn.commit()
            return resp(dict(row))

    return resp({"error": "Not found"}, 404)
