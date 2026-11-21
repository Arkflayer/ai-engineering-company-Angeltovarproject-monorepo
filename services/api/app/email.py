"""Envío de correos electrónicos vía Resend."""

from __future__ import annotations

from .security import get_settings

try:
    import resend  # type: ignore[import-untyped]

    _resend_available = True
except ImportError:
    _resend_available = False


def send_reset_email(to_email: str, reset_url: str) -> None:
    """Envía el enlace de restablecimiento de contraseña al usuario.

    En desarrollo (sin API key real) solo se registra un mensaje.
    """
    settings = get_settings()
    if not settings.resend_api_key:
        print(
            f"[DEV] reset-password email to {to_email}: {reset_url}"
        )
        return

    if not _resend_available:
        print(
            f"[WARN] resend package not installed; pretend-sent to {to_email}: {reset_url}"
        )
        return

    resend.api_key = settings.resend_api_key
    params = {
        "from": "onboarding@resend.dev",
        "to": [to_email],
        "subject": "Restablece tu contraseña — TrackFlow",
        "html": _build_reset_html(reset_url),
    }
    response = resend.Emails.send(params)
    print(f"[EMAIL] Sent reset token to {to_email}, id={response.get('id', '?')}")


def _build_reset_html(reset_url: str) -> str:
    """HTML simple para el correo de restablecimiento."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;padding:24px">
<h2 style="margin:0 0 16px;color:#237b66">Restablece tu contraseña</h2>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña. Este enlace expira en 30 minutos.</p>
<a href="{reset_url}" style="display:inline-block;background:#237b66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
  Restablecer contraseña
</a>
<p style="margin-top:16px;color:#666;font-size:13px">Si no solicitaste este cambio, ignora este mensaje.</p>
</div>
</body>
</html>"""