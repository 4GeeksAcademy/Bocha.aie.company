from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from services.api.auth import get_current_active_user, hash_password
from services.api.models import UserCreate, UserRead, UserRole, UserUpdate
from services.api.users_service import (
    create_user,
    delete_user,
    get_user_by_id,
    list_users,
    to_user_read,
    update_user,
)


router = APIRouter(prefix="/users", tags=["users"])


def _ensure_self_or_admin(current_user: UserRead, user_id: UUID) -> None:
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Acceso prohibido")


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate) -> UserRead:
    return create_user(payload, hash_password(payload.password))


@router.get("", response_model=list[UserRead])
def get_users(_: UserRead = Depends(get_current_active_user)) -> list[UserRead]:
    return list_users()


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    current_user: UserRead = Depends(get_current_active_user),
) -> UserRead:
    _ensure_self_or_admin(current_user, user_id)
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return to_user_read(user)


@router.put("/{user_id}", response_model=UserRead)
def put_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: UserRead = Depends(get_current_active_user),
) -> UserRead:
    _ensure_self_or_admin(current_user, user_id)
    return update_user(user_id, payload)


@router.delete("/{user_id}")
def remove_user(
    user_id: UUID,
    current_user: UserRead = Depends(get_current_active_user),
) -> dict[str, str]:
    _ensure_self_or_admin(current_user, user_id)
    delete_user(user_id)
    return {"message": "Usuario eliminado"}