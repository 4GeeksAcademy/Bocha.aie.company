from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from services.api.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
)
from services.api.models import AuthMeResponse, LoginResponse, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


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