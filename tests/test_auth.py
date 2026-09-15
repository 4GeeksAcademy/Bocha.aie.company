from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt

from services.api import auth
from services.api.models import ChangePasswordRequest, ForgotPasswordRequest, ProfileCreate, ResetPasswordRequest, UserCreate, UserRole, UserUpdate
from services.api.password_reset_service import create_reset_token
from services.api.routes import auth as auth_routes
from services.api.routes import users as users_routes
from services.api.users_service import create_user, get_user_by_email


def request_with_ip() -> SimpleNamespace:
    return SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))


def make_user(email="ana@example.com", password="password123"):
    payload = UserCreate(email=email, password=password, profile=ProfileCreate(name="Ana", phone="123", address="Calle 1"))
    create_user(payload, auth.hash_password(password))
    return get_user_by_email(email)


def test_login_success_returns_bearer_token(isolated_database, monkeypatch):
    user = make_user()
    monkeypatch.setenv("JWT_SECRET", "test-secret")

    response = auth_routes.login(OAuth2PasswordRequestForm(username=user.email, password="password123"))

    assert response.token_type == "bearer"
    assert jwt.decode(response.access_token, "test-secret", algorithms=[auth.ALGORITHM])["sub"] == str(user.id)


def test_login_rejects_unknown_user(isolated_database):
    with pytest.raises(HTTPException) as error:
        auth_routes.login(OAuth2PasswordRequestForm(username="missing@example.com", password="password123"))
    assert error.value.status_code == 401


def test_login_rejects_empty_password(isolated_database):
    make_user()

    with pytest.raises(HTTPException) as error:
        auth_routes.login(OAuth2PasswordRequestForm(username="ana@example.com", password=""))

    assert error.value.status_code == 401


def test_get_current_user_rejects_expired_token(isolated_database, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = jwt.encode({"sub": str(uuid4()), "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, "test-secret", algorithm=auth.ALGORITHM)

    with pytest.raises(HTTPException) as error:
        auth.get_current_user(token)
    assert error.value.status_code == 401


def test_auth_me_returns_authenticated_identity(isolated_database):
    current_user = auth.to_user_read(make_user())

    response = auth_routes.auth_me(current_user)

    assert response.email == current_user.email
    assert response.profile == current_user.profile


def test_auth_me_allows_user_without_profile():
    current_user = SimpleNamespace(email="profileless@example.com", role=UserRole.USER, profile=None)

    response = auth_routes.auth_me(current_user)

    # The endpoint must preserve the optional profile contract for valid users.
    assert response.profile is None


def test_register_creates_user_and_profile(isolated_database):
    response = users_routes.register_user(UserCreate(email="new@example.com", password="password123", profile=ProfileCreate(name="Nuevo", phone="123", address="Calle 2")))

    assert response.email == "new@example.com"
    assert response.profile.name == "Nuevo"


def test_register_rejects_duplicate_email_and_short_password(isolated_database):
    make_user()
    with pytest.raises(HTTPException) as duplicate:
        users_routes.register_user(UserCreate(email="ana@example.com", password="password123"))
    assert duplicate.value.status_code == 409

    with pytest.raises(ValueError):
        UserCreate(email="short@example.com", password="short")


def test_forgot_password_is_generic_for_unknown_email(isolated_database, monkeypatch):
    monkeypatch.setattr(auth_routes, "send_password_reset_email", lambda *args: pytest.fail("must not send"))

    response = auth_routes.forgot_password(ForgotPasswordRequest(email="unknown@example.com"), request_with_ip())

    assert "Si el correo está registrado" in response.message


def test_forgot_password_sends_token_for_existing_user(isolated_database, monkeypatch):
    user = make_user()
    sent = []
    monkeypatch.setattr(auth_routes, "send_password_reset_email", lambda *args: sent.append(args))

    response = auth_routes.forgot_password(ForgotPasswordRequest(email=user.email), request_with_ip())

    assert "Si el correo está registrado" in response.message
    assert sent and sent[0][0] == user.email


def test_forgot_password_returns_generic_response_when_rate_limited(isolated_database, monkeypatch):
    monkeypatch.setattr(auth_routes, "is_rate_limited", lambda email: True)
    monkeypatch.setattr(auth_routes, "create_reset_token", lambda email: pytest.fail("must not create a token"))

    response = auth_routes.forgot_password(ForgotPasswordRequest(email="ana@example.com"), request_with_ip())

    assert "Si el correo está registrado" in response.message


def test_reset_password_consumes_token_once(isolated_database, monkeypatch):
    user = make_user()
    raw_token = create_reset_token(user.email)
    monkeypatch.setattr(auth_routes, "record_audit_event", lambda *args, **kwargs: None)

    response = auth_routes.reset_password(ResetPasswordRequest(token=raw_token, new_password="newpassword123"), request_with_ip())
    assert "actualizada" in response.message

    with pytest.raises(HTTPException) as error:
        auth_routes.reset_password(ResetPasswordRequest(token=raw_token, new_password="another123"), request_with_ip())
    assert error.value.status_code == 400


def test_reset_password_accepts_minimum_new_password(isolated_database, monkeypatch):
    user = make_user()
    raw_token = create_reset_token(user.email)
    monkeypatch.setattr(auth_routes, "record_audit_event", lambda *args, **kwargs: None)

    response = auth_routes.reset_password(ResetPasswordRequest(token=raw_token, new_password="12345678"), request_with_ip())

    assert "actualizada" in response.message


def test_reset_password_rejects_malformed_token(isolated_database, monkeypatch):
    monkeypatch.setattr(auth_routes, "record_audit_event", lambda *args, **kwargs: None)

    with pytest.raises(HTTPException) as error:
        auth_routes.reset_password(ResetPasswordRequest(token="not-a-valid-token", new_password="newpassword123"), request_with_ip())

    assert error.value.status_code == 400


def test_change_password_rejects_wrong_current_password(isolated_database):
    user = make_user()
    current = auth.to_user_read(user)

    with pytest.raises(HTTPException) as error:
        auth_routes.change_password(ChangePasswordRequest(current_password="wrong", new_password="newpassword123"), request_with_ip(), current)
    assert error.value.status_code == 400


def test_change_password_updates_hash(isolated_database, monkeypatch):
    user = make_user()
    current = auth.to_user_read(user)
    monkeypatch.setattr(auth_routes, "record_audit_event", lambda *args, **kwargs: None)

    response = auth_routes.change_password(
        ChangePasswordRequest(current_password="password123", new_password="newpassword123"),
        request_with_ip(),
        current,
    )

    assert "actualizada" in response.message
    assert auth.verify_password("newpassword123", get_user_by_email(user.email).hashed_password)


def test_change_password_accepts_minimum_new_password(isolated_database, monkeypatch):
    user = make_user()
    current = auth.to_user_read(user)
    monkeypatch.setattr(auth_routes, "record_audit_event", lambda *args, **kwargs: None)

    response = auth_routes.change_password(
        ChangePasswordRequest(current_password="password123", new_password="12345678"),
        request_with_ip(),
        current,
    )

    assert "actualizada" in response.message


def test_user_cannot_access_another_user(isolated_database):
    first = auth.to_user_read(make_user("first@example.com"))
    second = make_user("second@example.com")

    with pytest.raises(HTTPException) as error:
        users_routes.get_user(second.id, first)
    assert error.value.status_code == 403


def test_admin_can_update_user_role(isolated_database):
    target = make_user("target@example.com")
    admin = auth.to_user_read(make_user("admin@example.com"))
    from services.api.database import get_users_table
    from tinydb import Query

    get_users_table().update({"role": UserRole.ADMIN.value}, Query().id == str(admin.id))
    admin = auth.to_user_read(get_user_by_email("admin@example.com"))
    updated = users_routes.put_user(target.id, UserUpdate(role=UserRole.MANAGER), admin)

    assert updated.role == UserRole.MANAGER