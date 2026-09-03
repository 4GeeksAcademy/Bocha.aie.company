from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from services.api.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_reset_token_expire_minutes,
    hash_password,
    verify_password,
)
from services.api.email_service import send_password_reset_email
from services.api.models import (
    AuthMeResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginResponse,
    PasswordActionResponse,
    ResetPasswordRequest,
    UserRead,
)
from services.api.password_reset_service import (
    build_reset_url,
    consume_reset_token,
    create_reset_token,
    is_rate_limited,
    record_audit_event,
)
from services.api.users_service import get_user_by_id, update_user_password


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

GENERIC_FORGOT_PASSWORD_MESSAGE = (
    "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en breve."
)


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> LoginResponse:
    user = authenticate_user(form_data.username, form_data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return LoginResponse(access_token=create_access_token(user))


@router.get("/me", response_model=AuthMeResponse)
def auth_me(current_user: UserRead = Depends(get_current_active_user)) -> AuthMeResponse:
    return AuthMeResponse(
        email=current_user.email,
        role=current_user.role,
        profile=current_user.profile,
    )


@router.post("/forgot-password", response_model=PasswordActionResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request) -> PasswordActionResponse:
    email = str(payload.email)
    ip = _client_ip(request)

    # Nunca revelamos si el email existe: siempre 200 con el mismo mensaje genérico.
    if is_rate_limited(email):
        record_audit_event("forgot_password_rate_limited", email=email, user_id=None, ip=ip)
        return PasswordActionResponse(message=GENERIC_FORGOT_PASSWORD_MESSAGE)

    raw_token = create_reset_token(email)
    record_audit_event("forgot_password_requested", email=email, user_id=None, ip=ip)

    if raw_token is not None:
        try:
            send_password_reset_email(
                email,
                build_reset_url(raw_token),
                get_reset_token_expire_minutes(),
            )
        except Exception:
            logger.exception("No se pudo enviar el email de reseteo de contraseña")

    return PasswordActionResponse(message=GENERIC_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=PasswordActionResponse)
def reset_password(payload: ResetPasswordRequest, request: Request) -> PasswordActionResponse:
    user_id = consume_reset_token(payload.token)
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    update_user_password(user_id, hash_password(payload.new_password))
    record_audit_event(
        "password_reset_completed",
        email=user.email,
        user_id=str(user_id),
        ip=_client_ip(request),
    )

    return PasswordActionResponse(message="Contraseña actualizada correctamente")


@router.post("/change-password", response_model=PasswordActionResponse)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: UserRead = Depends(get_current_active_user),
) -> PasswordActionResponse:
    user = get_user_by_id(current_user.id)

    if user is None or not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    update_user_password(current_user.id, hash_password(payload.new_password))
    record_audit_event(
        "password_changed",
        email=current_user.email,
        user_id=str(current_user.id),
        ip=_client_ip(request),
    )

    return PasswordActionResponse(message="Contraseña actualizada correctamente")
