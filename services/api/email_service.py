from __future__ import annotations

import os

import resend


def get_resend_api_key() -> str:
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError("RESEND_API_KEY no está configurado")

    return api_key


def get_email_from() -> str:
    return os.getenv("EMAIL_FROM", "Brasaland <onboarding@resend.dev>")


def _build_reset_email_html(reset_url: str, expire_minutes: int) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #1c1917;">Restablece tu contraseña</h1>
      <p style="font-size: 15px; line-height: 1.5; color: #44403c;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Brasaland.
        Este enlace es válido por {expire_minutes} minutos y solo puede usarse una vez.
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{reset_url}"
           style="background-color: #b45309; color: #ffffff; padding: 12px 24px; border-radius: 999px;
                  text-decoration: none; font-weight: 600; display: inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size: 13px; line-height: 1.5; color: #78716c;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
        <a href="{reset_url}" style="color: #b45309; word-break: break-all;">{reset_url}</a>
      </p>
      <p style="font-size: 13px; line-height: 1.5; color: #78716c;">
        Si no solicitaste este cambio, ignora este correo — tu contraseña seguirá siendo la misma.
      </p>
    </div>
    """


def send_password_reset_email(to_email: str, reset_url: str, expire_minutes: int) -> None:
    resend.api_key = get_resend_api_key()

    text_body = (
        "Solicitaste restablecer tu contraseña en Brasaland.\n"
        f"Abre este enlace (válido por {expire_minutes} minutos, un solo uso): {reset_url}\n\n"
        "Si no lo solicitaste, ignora este mensaje."
    )

    resend.Emails.send(
        {
            "from": get_email_from(),
            "to": [to_email],
            "subject": "Restablece tu contraseña — Brasaland",
            "html": _build_reset_email_html(reset_url, expire_minutes),
            "text": text_body,
        }
    )
