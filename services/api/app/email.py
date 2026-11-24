"""Envío de correos electrónicos vía Resend."""

from __future__ import annotations

from html import escape
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .security import get_settings


class EmailDeliveryError(RuntimeError):
    """Fallo de entrega con mensaje seguro para los logs de la API."""


def send_reset_email(to_email: str, reset_url: str) -> None:
    """Envía el enlace de restablecimiento mediante la API HTTP de Resend."""
    settings = get_settings()
    if not settings.resend_api_key:
        raise EmailDeliveryError("RESEND_API_KEY no está configurada.")

    payload = json.dumps({
        "from": settings.resend_from_email,
        "to": [to_email],
        "subject": "Restablece tu contraseña — TrackFlow",
        "html": _build_reset_html(reset_url),
    }).encode("utf-8")
    request = Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "TrackFlow-API/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=15) as response:
            result = json.loads(response.read())
    except HTTPError as exc:
        detail = exc.reason
        try:
            body_data = exc.read().decode("utf-8", errors="replace").strip()
            if body_data:
                detail = body_data[:200]
        except Exception:
            pass
        raise EmailDeliveryError(f"Resend rechazó el envío (HTTP {exc.code}; {detail}).") from exc
    except (URLError, TimeoutError) as exc:
        raise EmailDeliveryError("No se pudo conectar con Resend para enviar el correo.") from exc

    if not isinstance(result, dict) or not result.get("id"):
        raise EmailDeliveryError("Resend no confirmó la recepción del correo.")
    print(f"[EMAIL] Resend accepted reset email (id={result['id']})")


def _build_reset_html(reset_url: str) -> str:
    """HTML simple para el correo de restablecimiento."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f4f4f4;padding:24px">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;padding:24px">
<h2 style="margin:0 0 16px;color:#237b66">Restablece tu contraseña</h2>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña. Este enlace expira en 30 minutos.</p>
<a href="{escape(reset_url, quote=True)}" style="display:inline-block;background:#237b66;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
  Restablecer contraseña
</a>
<p style="margin-top:16px;color:#666;font-size:13px">Si no solicitaste este cambio, ignora este mensaje.</p>
</div>
</body>
</html>"""