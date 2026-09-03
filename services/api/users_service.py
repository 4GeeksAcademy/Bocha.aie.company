from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from tinydb import Query
from tinydb.table import Document

from services.api.database import get_profiles_table, get_users_table
from services.api.models import (
    Profile,
    ProfileCreate,
    UserCreate,
    UserRead,
    UserRecord,
    UserRole,
    UserUpdate,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_datetime(value: datetime) -> str:
    return value.isoformat()


def _document_to_user(document: Document) -> UserRecord:
    payload = dict(document)
    return UserRecord(**payload)


def _document_to_profile(document: Document) -> Profile:
    payload = dict(document)
    return Profile(**payload)


def get_profile_by_user_id(user_id: UUID) -> Profile | None:
    table = get_profiles_table()
    query = Query()
    document = table.get(query.user_id == str(user_id))

    if document is None:
        return None

    return _document_to_profile(document)


def create_profile_for_user(user_id: UUID, profile: ProfileCreate | None) -> Profile:
    table = get_profiles_table()
    payload = {
        "id": str(uuid4()),
        "user_id": str(user_id),
        "name": profile.name if profile else None,
        "phone": profile.phone if profile else None,
        "address": profile.address if profile else None,
    }
    table.insert(payload)
    document = table.get(Query().id == payload["id"])

    if document is None:
        raise HTTPException(status_code=500, detail="No se pudo crear el perfil")

    return _document_to_profile(document)


def create_user(payload: UserCreate, hashed_password: str) -> UserRead:
    table = get_users_table()
    query = Query()

    if table.contains(query.email == str(payload.email)):
        raise HTTPException(status_code=409, detail="El email ya está registrado")

    user_id = uuid4()
    now = _now()
    user_data = {
        "id": str(user_id),
        "email": str(payload.email),
        "hashed_password": hashed_password,
        "is_active": True,
        "role": UserRole.USER.value,
        "created_at": _serialize_datetime(now),
    }
    table.insert(user_data)
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=500, detail="No se pudo crear el usuario")

    create_profile_for_user(user_id, payload.profile)
    return to_user_read(user)


def get_user_by_id(user_id: UUID) -> UserRecord | None:
    table = get_users_table()
    document = table.get(Query().id == str(user_id))

    if document is None:
        return None

    return _document_to_user(document)


def update_user_password(user_id: UUID, hashed_password: str) -> None:
    table = get_users_table()
    table.update({"hashed_password": hashed_password}, Query().id == str(user_id))


def get_user_by_email(email: str) -> UserRecord | None:
    table = get_users_table()
    document = table.get(Query().email == email)

    if document is None:
        return None

    return _document_to_user(document)


def list_users() -> list[UserRead]:
    table = get_users_table()
    return [to_user_read(_document_to_user(document)) for document in table.all()]


def update_user(user_id: UUID, payload: UserUpdate) -> UserRead:
    table = get_users_table()
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    updates: dict[str, str] = {}

    if payload.email is not None:
        existing = get_user_by_email(str(payload.email))
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="El email ya está registrado")
        updates["email"] = str(payload.email)

    if payload.role is not None:
        updates["role"] = payload.role.value

    if payload.password is not None:
        from services.api.auth import hash_password

        updates["hashed_password"] = hash_password(payload.password)

    if updates:
        table.update(updates, Query().id == str(user_id))

    updated_user = get_user_by_id(user_id)

    if updated_user is None:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el usuario")

    return to_user_read(updated_user)


def delete_user(user_id: UUID) -> None:
    users_table = get_users_table()
    profiles_table = get_profiles_table()

    if get_user_by_id(user_id) is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    users_table.remove(Query().id == str(user_id))
    profiles_table.remove(Query().user_id == str(user_id))


def update_profile(user_id: UUID, profile_data: dict[str, str | None]) -> Profile:
    table = get_profiles_table()
    query = Query()
    document = table.get(query.user_id == str(user_id))

    if document is None:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    table.update(profile_data, query.user_id == str(user_id))
    updated_document = table.get(query.user_id == str(user_id))

    if updated_document is None:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el perfil")

    return _document_to_profile(updated_document)


def to_user_read(user: UserRecord) -> UserRead:
    profile = get_profile_by_user_id(user.id)
    return UserRead(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        profile=profile,
    )