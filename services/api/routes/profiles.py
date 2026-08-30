from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from services.api.auth import get_current_active_user
from services.api.models import Profile, ProfileUpdate, UserRead
from services.api.users_service import get_profile_by_user_id, update_profile


router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=Profile)
def get_my_profile(current_user: UserRead = Depends(get_current_active_user)) -> Profile:
    profile = get_profile_by_user_id(current_user.id)

    if profile is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return profile


@router.put("/me", response_model=Profile)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: UserRead = Depends(get_current_active_user),
) -> Profile:
    return update_profile(current_user.id, payload.model_dump())