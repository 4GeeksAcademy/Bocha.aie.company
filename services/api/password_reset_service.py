from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
from uuid import UUID, uuid4

from fastapi import HTTPException
from tinydb import Query

from services.api.auth import (
    generate_reset_token,
    get_reset_token_expire_minutes,
    hash_reset_token,
)
from services.api.database import get_password_reset_audit_table, get_password_resets_table
from services.api.users_service import get_user_by_email


def _rate_limit_max_requests() -> int:
    return int(os.getenv("PASSWORD_RESET_RATE_LIMIT_MAX", "3"))


def _rate_limit_window_minutes() -> int:
    return int(os.getenv("PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES", "15"))


def _now() -> datetime:
    return datetime.now(timezone.utc)


def is_rate_limited(email: str) -> bool:
    table = get_password_resets_table()
    query = Query()
    window_start = (_now() - timedelta(minutes=_rate_limit_window_minutes())).isoformat()
    recent_requests = table.search((query.email == email) & (query.created_at >= window_start))
    return len(recent_requests) >= _rate_limit_max_requests()


def create_reset_token(email: str) -> str | None:
    """Genera y persiste (hasheado) un token de reseteo para el usuario, si existe."""
    user = get_user_by_email(email)

    if user is None:
        return None

    raw_token = generate_reset_token()
    now = _now()
    expires_at = now + timedelta(minutes=get_reset_token_expire_minutes())

    table = get_password_resets_table()
    table.insert(
        {
            "id": str(uuid4()),
            "user_id": str(user.id),
            "email": email,
            "token_hash": hash_reset_token(raw_token),
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "used_at": None,
        }
    )

    return raw_token


def consume_reset_token(raw_token: str) -> UUID:
    """Valida un token de un solo uso y lo marca como consumido. Lanza 400 si no es válido."""
    invalid_token_error = HTTPException(status_code=400, detail="Token inválido o expirado")

    table = get_password_resets_table()
    query = Query()
    record = table.get(query.token_hash == hash_reset_token(raw_token))

    if record is None or record.get("used_at"):
        raise invalid_token_error

    if _now() > datetime.fromisoformat(record["expires_at"]):
        raise invalid_token_error

    table.update({"used_at": _now().isoformat()}, query.token_hash == record["token_hash"])

    return UUID(record["user_id"])


def build_reset_url(raw_token: str) -> str:
    base_url = os.getenv("FRONTEND_RESET_URL", "http://localhost:3000/reset-password")
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}token={raw_token}"


def record_audit_event(
    event: str,
    *,
    email: str | None,
    user_id: str | None,
    ip: str | None,
) -> None:
    table = get_password_reset_audit_table()
    table.insert(
        {
            "id": str(uuid4()),
            "event": event,
            "email": email,
            "user_id": user_id,
            "ip": ip,
            "timestamp": _now().isoformat(),
        }
    )
