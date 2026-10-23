from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage
from html import escape

from .content import read_mail_config

log = logging.getLogger("personal-site.mail")


def resolve_config() -> dict | None:
    config = read_mail_config()
    if config.get("enabled") and config.get("host") and config.get("user") and config.get("pass"):
        return {
            "host": config["host"],
            "port": int(config.get("port") or 465),
            "secure": bool(config.get("secure", True)),
            "user": config["user"],
            "pass": config["pass"],
            "to": config.get("to") or config["user"],
            "subjectPrefix": config.get("subjectPrefix") or "【个人站留言】",
        }

    if os.environ.get("SMTP_HOST") and os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return {
            "host": os.environ["SMTP_HOST"],
            "port": int(os.environ.get("SMTP_PORT", "465")),
            "secure": os.environ.get("SMTP_SECURE", "true").lower() != "false",
            "user": os.environ["SMTP_USER"],
            "pass": os.environ["SMTP_PASS"],
            "to": os.environ.get("SMTP_TO") or os.environ["SMTP_USER"],
            "subjectPrefix": os.environ.get("SMTP_SUBJECT_PREFIX", "【个人站留言】"),
        }
    return None


def send_contact_mail(name: str, email: str, message: str) -> bool:
    config = resolve_config()
    if not config:
        log.info("SMTP not configured, contact message kept in logs: %s <%s>", name, email)
        return False

    html = f"""\
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0f0a;color:#e5e7eb;border-radius:12px;border:1px solid #10b98133">
  <div style="font-size:13px;color:#34d399;margin-bottom:16px;letter-spacing:.05em">▸ 新的联系表单留言</div>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;color:#71717a;width:80px;vertical-align:top">姓名</td><td style="padding:8px 0;color:#fafafa">{escape(name)}</td></tr>
    <tr><td style="padding:8px 0;color:#71717a;width:80px;vertical-align:top">邮箱</td><td style="padding:8px 0;color:#fafafa"><a href="mailto:{escape(email)}" style="color:#34d399">{escape(email)}</a></td></tr>
    <tr><td style="padding:8px 0;color:#71717a;width:80px;vertical-align:top">留言</td><td style="padding:8px 0;color:#e5e7eb;line-height:1.6">{escape(message).replace(chr(10), '<br/>')}</td></tr>
  </table>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #ffffff14;font-size:12px;color:#71717a">来自个人站联系表单</div>
</div>"""

    msg = EmailMessage()
    msg["Subject"] = f"{config['subjectPrefix']} {name}"
    msg["From"] = f"联系表单 <{config['user']}>"
    msg["To"] = config["to"]
    msg.set_content(f"姓名: {name}\n邮箱: {email}\n留言:\n{message}")
    msg.add_alternative(html, subtype="html")

    if config["secure"]:
        client = smtplib.SMTP_SSL(config["host"], config["port"], timeout=15)
    else:
        client = smtplib.SMTP(config["host"], config["port"], timeout=15)
        client.starttls()
    try:
        client.login(config["user"], config["pass"])
        client.send_message(msg)
    finally:
        client.quit()
    return True
