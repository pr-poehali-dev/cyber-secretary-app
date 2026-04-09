"""
Сервис email-уведомлений LexDesk.
Проверяет сроки обжалования и отправляет письма на указанный адрес.
Вызывается вручную (кнопка «Тест») или по расписанию.
"""
import json
import os
import smtplib
import psycopg2
from psycopg2.extras import RealDictCursor
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date

SCHEMA = "t_p21225702_cyber_secretary_app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def resp(body, status=200):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
    }

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def send_email(to_addr: str, subject: str, html: str) -> None:
    """Отправляет письмо через SMTP. Поддерживает Яндекс, Gmail, Mail.ru."""
    smtp_login = os.environ.get("SMTP_LOGIN", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    smtp_host = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"LexDesk <{smtp_login}>"
    msg["To"] = to_addr
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_login, smtp_password)
        server.sendmail(smtp_login, to_addr, msg.as_string())

def build_html(deadlines: list, days_filter: int | None = None) -> str:
    """Строит HTML-письмо со списком приближающихся сроков."""
    today = date.today().strftime("%d.%m.%Y")

    rows = ""
    for d in deadlines:
        days_left = d["days_left"]
        if days_left <= 1:
            color = "#dc2626"
            badge = "Завтра" if days_left == 1 else "Сегодня"
        elif days_left <= 7:
            color = "#d97706"
            badge = f"{days_left} дн."
        else:
            color = "#16a34a"
            badge = f"{days_left} дн."

        rows += f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;background:{color}22;color:{color};
              border:1px solid {color}55;border-radius:4px;padding:2px 8px;
              font-size:12px;font-weight:700;white-space:nowrap;">{badge}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#111827;font-size:14px;">{d['title']}</div>
            <div style="color:#6b7280;font-size:12px;margin-top:2px;">{d['client']}</div>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;
            color:#374151;font-size:13px;white-space:nowrap;">{d['date']}</td>
        </tr>"""

    title = f"Сроки за {days_filter} дней" if days_filter else "Все активные сроки"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;
    border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:#1e3461;padding:20px 24px;display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;background:#d97706;border-radius:6px;
        display:flex;align-items:center;justify-content:center;
        font-size:16px;line-height:32px;text-align:center;">⚖</div>
      <div>
        <div style="color:#ffffff;font-size:16px;font-weight:700;">LexDesk</div>
        <div style="color:#93c5fd;font-size:12px;">Напоминание о сроках обжалования</div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">
        Добрый день! Напоминаем о приближающихся сроках обжалования на <strong>{today}</strong>.
      </p>

      <h2 style="margin:0 0 12px;font-size:15px;color:#111827;">{title}</h2>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;
        border-radius:8px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;
              font-size:11px;font-weight:600;text-transform:uppercase;
              border-bottom:1px solid #e5e7eb;">Срок</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;
              font-size:11px;font-weight:600;text-transform:uppercase;
              border-bottom:1px solid #e5e7eb;">Дело</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;
              font-size:11px;font-weight:600;text-transform:uppercase;
              border-bottom:1px solid #e5e7eb;">Дата</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">
        Это автоматическое письмо от системы LexDesk. Не отвечайте на него.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:12px 24px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
        LexDesk · Адвокатская практика · Данные защищены AES-256
      </p>
    </div>
  </div>
</body>
</html>"""

def handler(event: dict, context) -> dict:
    """Отправляет email-уведомления о сроках обжалования."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    to_email = body.get("email", "").strip()
    if not to_email:
        return resp({"error": "email обязателен"}, 400)

    # Проверяем наличие SMTP-настроек
    if not os.environ.get("SMTP_PASSWORD"):
        return resp({"error": "SMTP_PASSWORD не настроен. Добавьте секрет в настройках проекта."}, 500)
    if not os.environ.get("SMTP_LOGIN"):
        return resp({"error": "SMTP_LOGIN не настроен. Добавьте секрет в настройках проекта."}, 500)

    days_filter = body.get("days_filter")  # None = тест (все), иначе int (1, 3, 7)
    is_test = body.get("test", False)

    # Получаем сроки из БД
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if days_filter is not None:
                cur.execute(
                    f"SELECT * FROM {SCHEMA}.deadlines WHERE days_left <= %s ORDER BY days_left",
                    (days_filter,)
                )
            else:
                cur.execute(f"SELECT * FROM {SCHEMA}.deadlines ORDER BY days_left")
            deadlines = [dict(r) for r in cur.fetchall()]

    if not deadlines and not is_test:
        return resp({"sent": False, "message": "Нет сроков для уведомления"})

    # Для тестового письма берём максимум 5 записей
    if is_test:
        deadlines = deadlines[:5]

    if not deadlines:
        deadlines = [{
            "title": "Тестовое уведомление",
            "client": "Пример доверителя",
            "days_left": 3,
            "date": "12.04.2026",
        }]

    subject = "⚖️ LexDesk: напоминание о сроках обжалования"
    if is_test:
        subject = "⚖️ LexDesk: тестовое письмо"

    html = build_html(deadlines, days_filter)
    send_email(to_email, subject, html)

    return resp({
        "sent": True,
        "to": to_email,
        "count": len(deadlines),
        "message": f"Письмо отправлено на {to_email}",
    })
