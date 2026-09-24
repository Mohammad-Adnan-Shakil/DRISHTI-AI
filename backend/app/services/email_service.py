import os
import logging
from pathlib import Path
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),  # escapes patient-entered text
)

# DR grade 0-4 -> display text + card colors (bg, border, label, text)
GRADE_STYLES = {
    0: ("No Diabetic Retinopathy detected",                 "#dcfce7", "#16a34a", "#166534", "#14532d"),
    1: ("Mild Non-Proliferative Diabetic Retinopathy",      "#fef3c7", "#f59e0b", "#92400e", "#78350f"),
    2: ("Moderate Non-Proliferative Diabetic Retinopathy",  "#ffedd5", "#ea580c", "#9a3412", "#7c2d12"),
    3: ("Severe Non-Proliferative Diabetic Retinopathy",    "#fee2e2", "#dc2626", "#991b1b", "#7f1d1d"),
    4: ("Proliferative Diabetic Retinopathy",               "#fecaca", "#b91c1c", "#7f1d1d", "#450a0a"),
}

# Images embedded inside the email (referenced in HTML as cid:<key>)
LOGO_INLINE = {"drishti-logo": TEMPLATE_DIR / "drishti-logo.png"}


def mask_email(email: str) -> str:
    """a***@gmail.com — never log full patient emails."""
    try:
        local, domain = email.split("@", 1)
        return f"{local[0]}***@{domain}"
    except Exception:
        return "***"


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str,
    inline_images: dict | None = None,   # {"cid-name": Path}
    attachments: list | None = None,     # [(filename, bytes, "application/pdf")]
) -> dict:
    """
    Send an email via the configured provider.
    Never raises — always returns {status, message_id, error}.
    """
    provider = os.getenv("EMAIL_PROVIDER", "smtp")
    if provider != "smtp":
        logger.error(f"Unsupported EMAIL_PROVIDER: {provider}")
        return {"status": "failed", "message_id": None, "error": f"unsupported provider {provider}"}

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER") or getattr(settings, "SMTP_USER", None)
    password = os.getenv("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", None)
    from_name = os.getenv("EMAIL_FROM_NAME") or getattr(settings, "EMAIL_FROM_NAME", "DRISHTI-AI Screening")

    if not user or not password:
        logger.error("SMTP_USER or SMTP_PASSWORD not set")
        return {"status": "failed", "message_id": None, "error": "smtp credentials missing"}

    try:
        msg = EmailMessage()
        msg["From"] = formataddr((from_name, user))
        msg["To"] = to
        msg["Subject"] = subject
        msg["Message-ID"] = make_msgid(domain=user.split("@")[1])
        msg.set_content(text)                      # plain-text fallback
        msg.add_alternative(html, subtype="html")  # HTML version

        # Embed inline images (logo) into the HTML part
        if inline_images:
            html_part = msg.get_payload()[1]
            for cid, path in inline_images.items():
                path = Path(path)
                subtype = path.suffix.lstrip(".").lower().replace("jpg", "jpeg")
                html_part.add_related(
                    path.read_bytes(), maintype="image", subtype=subtype, cid=f"<{cid}>"
                )

        # File attachments (PDF report)
        for filename, data, mime in attachments or []:
            maintype, subtype = mime.split("/", 1)
            msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

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


def render_screening_email(
    patient_name: str,
    dr_grade: int,
    recommended_action: str,
    screening_date: str,
    phc_name: str,
    phc_contact: str,
) -> tuple[str, str, str]:
    """Returns (subject, html, text) for a screening result email."""
    grade_text, bg, border, label, text_color = GRADE_STYLES.get(
        dr_grade,
        ("Result available — please contact your clinic", "#f3f4f6", "#6b7280", "#374151", "#111827"),
    )

    html = _jinja_env.get_template("screening_result.html").render(
        patientName=patient_name,
        phcName=phc_name,
        screeningDate=screening_date,
        drGradeText=grade_text,
        recommendedAction=recommended_action,
        phcContact=phc_contact,
        gradeBg=bg,
        gradeBorder=border,
        gradeLabel=label,
        gradeText=text_color,
    )

    text = (
        f"Dear {patient_name},\n\n"
        f"Thank you for completing your eye screening at {phc_name} on {screening_date}.\n\n"
        f"SCREENING RESULT: {grade_text}\n"
        f"RECOMMENDED ACTION: {recommended_action}\n\n"
        f"Need help? Contact {phc_name} at {phc_contact}.\n\n"
        "This is an AI-assisted screening result and does not replace professional diagnosis.\n"
        "— DRISHTI-AI"
    )

    subject = "Your DRISHTI-AI Eye Screening Result"
    return subject, html, text