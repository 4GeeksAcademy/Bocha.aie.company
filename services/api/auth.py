from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from services.api.models import UserRead, UserRecord
from services.api.users_service import get_user_by_id, to_user_read


ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
password_hasher = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")

    if not secret:
        raise RuntimeError("JWT_SECRET no está configurado")

    return secret


def get_access_token_expire_minutes() -> int:
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    return int(raw_value)


def get_reset_token_expire_minutes() -> int:
    raw_value = os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30")
    return int(raw_value)


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(raw_token: str) -> str:
    # Los tokens de reseteo tienen entropía alta: un digest determinista basta para buscarlos por igualdad.
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hasher.verify(password, hashed_password)


def create_access_token(user: UserRecord) -> str:
    expire_at = datetime.now(timezone.utc) + timedelta(
        minutes=get_access_token_expire_minutes()
    )
    payload = {
        "sub": str(user.id),
        "exp": expire_at,
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)


def authenticate_user(email: str, password: str) -> UserRecord | None:
    from services.api.users_service import get_user_by_email

    user = get_user_by_email(email)

    if user is None:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserRead:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
        subject = payload.get("sub")

        if not subject:
            raise unauthorized

        user = get_user_by_id(UUID(subject))

    except (JWTError, ValueError):
        raise unauthorized

    if user is None:
        raise unauthorized

    return to_user_read(user)


def get_current_active_user(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    return current_user