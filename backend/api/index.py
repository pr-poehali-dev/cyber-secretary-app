"""
API для адвокатской системы LexDesk.
Управляет доверителями, задачами, следственными действиями и сроками.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = "t_p21225702_cyber_secretary_app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(body, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/")
    qs = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # ── /clients ────────────────────────────────────────────────────────────
    if path == "/clients":
        if method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        SELECT c.*,
                          COALESCE(json_agg(h ORDER BY h.event_date DESC) FILTER (WHERE h.id IS NOT NULL), '[]') AS history
                        FROM {SCHEMA}.clients c
                        LEFT JOIN {SCHEMA}.client_history h ON h.client_id = c.id
                        GROUP BY c.id
                        ORDER BY c.id
                    """)
                    rows = cur.fetchall()
            return resp([dict(r) for r in rows])

        if method == "POST":
            f = body
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.clients
                          (name, type, case_number, status, next_date, total_billed, last_contact, category,
                           investigator, investigator_phone, investigator_office, agency)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING *
                    """, (f["name"], f["type"], f["caseNumber"], f.get("status","active"),
                          f.get("nextDate","—"), f.get("totalBilled",0), f.get("lastContact",""),
                          f.get("category",""), f.get("investigator",""), f.get("investigatorPhone",""),
                          f.get("investigatorOffice",""), f.get("agency","")))
                    row = dict(cur.fetchone())
                conn.commit()
            row["history"] = []
            return resp(row, 201)

    # ── /clients/{id} ────────────────────────────────────────────────────────
    if path.startswith("/clients/"):
        client_id = int(path.split("/")[2])

        if method == "PUT":
            f = body
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.clients SET
                          investigator=%s, investigator_phone=%s, investigator_office=%s,
                          agency=%s, next_date=%s
                        WHERE id=%s RETURNING *
                    """, (f["investigator"], f["investigatorPhone"], f["investigatorOffice"],
                          f["agency"], f["nextDate"], client_id))
                    row = dict(cur.fetchone())
                    cur.execute(f"SELECT * FROM {SCHEMA}.client_history WHERE client_id=%s ORDER BY event_date DESC", (client_id,))
                    row["history"] = [dict(r) for r in cur.fetchall()]
                conn.commit()
            return resp(row)

        if method == "POST" and path.endswith("/history"):
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.client_history (client_id, note, event_date)
                        VALUES (%s, %s, %s) RETURNING *
                    """, (client_id, body["note"], body["eventDate"]))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row, 201)

    # ── /tasks ───────────────────────────────────────────────────────────────
    if path == "/tasks":
        date_filter = qs.get("date", "")
        if method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if date_filter:
                        cur.execute(f"SELECT * FROM {SCHEMA}.tasks WHERE task_date=%s ORDER BY time", (date_filter,))
                    else:
                        cur.execute(f"SELECT * FROM {SCHEMA}.tasks ORDER BY task_date, time")
                    rows = cur.fetchall()
            return resp([dict(r) for r in rows])

        if method == "POST":
            f = body
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.tasks (title, type, time, client, done, urgent, task_date)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *
                    """, (f["title"], f["type"], f["time"], f["client"],
                          f.get("done", False), f.get("urgent", False), f.get("taskDate", "")))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row, 201)

    # ── /tasks/{id} ──────────────────────────────────────────────────────────
    if path.startswith("/tasks/"):
        task_id = int(path.split("/")[2])
        if method == "PATCH":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"UPDATE {SCHEMA}.tasks SET done=%s WHERE id=%s RETURNING *",
                                (body["done"], task_id))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row)

    # ── /investigations ──────────────────────────────────────────────────────
    if path == "/investigations":
        if method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"SELECT * FROM {SCHEMA}.investigations ORDER BY date, id")
                    rows = cur.fetchall()
            return resp([dict(r) for r in rows])

        if method == "POST":
            f = body
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.investigations (client, action, date, location, done, type)
                        VALUES (%s,%s,%s,%s,%s,%s) RETURNING *
                    """, (f["client"], f["action"], f["date"], f["location"],
                          f.get("done", False), f["type"]))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row, 201)

    # ── /investigations/{id} ─────────────────────────────────────────────────
    if path.startswith("/investigations/"):
        inv_id = int(path.split("/")[2])
        if method == "PATCH":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"UPDATE {SCHEMA}.investigations SET done=%s WHERE id=%s RETURNING *",
                                (body["done"], inv_id))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row)

    # ── /deadlines ───────────────────────────────────────────────────────────
    if path == "/deadlines":
        if method == "GET":
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"SELECT * FROM {SCHEMA}.deadlines ORDER BY days_left")
                    rows = cur.fetchall()
            return resp([dict(r) for r in rows])

        if method == "POST":
            f = body
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.deadlines (title, client, days_left, type, date)
                        VALUES (%s,%s,%s,%s,%s) RETURNING *
                    """, (f["title"], f["client"], f["daysLeft"], f["type"], f["date"]))
                    row = dict(cur.fetchone())
                conn.commit()
            return resp(row, 201)

    return resp({"error": "Not found"}, 404)
