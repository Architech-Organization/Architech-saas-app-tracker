from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User, Software
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/notifications", tags=["notifications"])

class SMTPSettings(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    from_email: str
    from_name: str = "LicenseVault"

class NotificationSettings(BaseModel):
    enabled: bool = True
    reminder_days: List[int] = [7, 30, 90]
    notify_emails: List[str] = []
    smtp: Optional[SMTPSettings] = None

class TestEmailRequest(BaseModel):
    to_email: str

# In-memory settings store (persists per process restart)
# In production you'd store this in DB
_settings: dict = {
    "enabled": False,
    "reminder_days": [7, 30, 90],
    "notify_emails": [],
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_user": "",
    "smtp_password": "",
    "from_email": "",
    "from_name": "LicenseVault",
}

def send_email(to: str, subject: str, html: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{_settings['from_name']} <{_settings['from_email']}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(_settings["smtp_host"], _settings["smtp_port"]) as server:
            server.starttls()
            server.login(_settings["smtp_user"], _settings["smtp_password"])
            server.sendmail(_settings["from_email"], to, msg.as_string())
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def renewal_email_html(renewals: list, days: int) -> str:
    rows = "".join([f"""
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:10px 12px;font-weight:600">{sw['name']}</td>
      <td style="padding:10px 12px;color:#666">{sw['vendor']}</td>
      <td style="padding:10px 12px;color:#666">{sw['owner']}</td>
      <td style="padding:10px 12px">{sw['renewal_date']}</td>
      <td style="padding:10px 12px;color:{'#dc2626' if days<=7 else '#d97706'};font-weight:600">{sw['days_left']}d</td>
    </tr>""" for sw in renewals])
    return f"""
    <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:linear-gradient(135deg,#7c5cfc,#5b8af5);padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">🔐 LicenseVault</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Architech Software License Management</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <h2 style="font-size:18px;color:#111;margin:0 0 6px">⚠️ {len(renewals)} license{'s' if len(renewals)>1 else ''} renewing within {days} days</h2>
        <p style="color:#666;font-size:14px;margin:0 0 20px">Please review and take action before the renewal dates.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Software</th>
              <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Vendor</th>
              <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Owner</th>
              <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Renewal Date</th>
              <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Days Left</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <div style="margin-top:24px;padding:16px;background:#f0f4ff;border-radius:8px;font-size:13px;color:#4338ca">
          Log in to LicenseVault to manage these renewals.
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">LicenseVault · Architech · This is an automated reminder</p>
    </div>"""

@router.get("/settings")
def get_settings(_: User = Depends(require_admin)):
    return {k: v for k, v in _settings.items() if k != "smtp_password"}

@router.post("/settings")
def save_settings(payload: dict, _: User = Depends(require_admin)):
    for key in ["enabled", "reminder_days", "notify_emails", "smtp_host", "smtp_port",
                "smtp_user", "smtp_password", "from_email", "from_name"]:
        if key in payload:
            _settings[key] = payload[key]
    return {"message": "Settings saved"}

@router.post("/test")
def send_test(payload: TestEmailRequest, _: User = Depends(require_admin)):
    if not _settings["smtp_host"]:
        raise HTTPException(status_code=400, detail="SMTP not configured. Save settings first.")
    html = renewal_email_html([{
        "name": "Sample Software", "vendor": "Sample Vendor",
        "owner": "IT Team", "renewal_date": "2026-09-01", "days_left": 25
    }], 30)
    ok = send_email(payload.to_email, "LicenseVault — Test Notification", html)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP settings.")
    return {"message": f"Test email sent to {payload.to_email}"}

@router.post("/send-reminders")
def send_reminders(background_tasks: BackgroundTasks, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not _settings["enabled"] or not _settings["smtp_host"]:
        raise HTTPException(status_code=400, detail="Notifications not configured or disabled")
    background_tasks.add_task(_run_reminders, db)
    return {"message": "Reminders queued"}

def _run_reminders(db: Session):
    today = date.today()
    all_sw = db.query(Software).all()
    for days in _settings["reminder_days"]:
        renewals = []
        for sw in all_sw:
            days_left = (sw.renewal_date - today).days
            if 0 <= days_left <= days:
                renewals.append({
                    "name": sw.name, "vendor": sw.vendor,
                    "owner": sw.owner_label or "—",
                    "renewal_date": str(sw.renewal_date),
                    "days_left": days_left
                })
        if renewals:
            subject = f"LicenseVault — {len(renewals)} renewal{'s' if len(renewals)>1 else ''} within {days} days"
            html = renewal_email_html(renewals, days)
            for email in _settings["notify_emails"]:
                send_email(email, subject, html)
