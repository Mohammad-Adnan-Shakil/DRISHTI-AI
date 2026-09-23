import os
import logging
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

import aiosmtplib

logger = logging.getLogger(__name__)


def mask_email(email: str) -> str:
    """a***@gmail.com — never log full patient emails."""
    try:
        local, domain = email.split("@", 1)
        return f"{local[0]}***@{domain}"
    except Exception:
        return "***"


async def send_email(to: str, subject: str, html: str, text: str) -> dict:
    """
    Send an email via the configured provider.
    Never raises — always returns {status, message_id, error}.
    Config is read at call time so .env load order doesn't matter.
    """
    provider = os.getenv("EMAIL_PROVIDER", "smtp")
    if provider != "smtp":
        logger.error(f"Unsupported EMAIL_PROVIDER: {provider}")
        return {"status": "failed", "message_id": None, "error": f"unsupported provider {provider}"}

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("EMAIL_FROM_NAME", "DRISHTI-AI Screening")

    if not user or not password:
        logger.error("SMTP_USER or SMTP_PASSWORD not set")
        return {"status": "failed", "message_id": None, "error": "smtp credentials missing"}

    msg = EmailMessage()
    msg["From"] = formataddr((from_name, user))
    msg["To"] = to
    msg["Subject"] = subject
    msg["Message-ID"] = make_msgid(domain=user.split("@")[1])
    msg.set_content(text)                      # plain-text fallback
    msg.add_alternative(html, subtype="html")  # HTML version

    try:
        await aiosmtplib.send(
            msg,
            hostname=host,
            port=port,
            username=user,
            password=password,
            start_tls=True,
            timeout=20,
        )
        logger.info(f"Email sent to {mask_email(to)} | id={msg['Message-ID']}")
        return {"status": "sent", "message_id": msg["Message-ID"], "error": None}
    except Exception as e:
        logger.error(f"Email failed to {mask_email(to)} | {type(e).__name__}: {e}")
        return {"status": "failed", "message_id": None, "error": str(e)}