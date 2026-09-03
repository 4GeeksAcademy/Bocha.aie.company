from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


class SupplierCategory(str, Enum):
    CARNE = "carne"
    VERDURAS_Y_HORTALIZAS = "verduras_y_hortalizas"
    SALSAS_Y_CONDIMENTOS = "salsas_y_condimentos"
    BEBIDAS = "bebidas"
    PACKAGING = "packaging"
    PRODUCTOS_LIMPIEZA = "productos_limpieza"
    LACTEOS = "lacteos"
    CARBON_Y_COMBUSTIBLE = "carbon_y_combustible"


class SupplierCountry(str, Enum):
    COLOMBIA = "Colombia"
    USA = "USA"


class SupplierCurrency(str, Enum):
    COP = "COP"
    USD = "USD"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2)
    country: SupplierCountry
    categories: list[SupplierCategory] = Field(min_length=1)
    rate_per_unit: float = Field(gt=0)
    currency: SupplierCurrency
    status: SupplierStatus
    contact_email: EmailStr | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_currency_by_country(self) -> "SupplierCreate":
        expected_currency = (
            SupplierCurrency.COP
            if self.country == SupplierCountry.COLOMBIA
            else SupplierCurrency.USD
        )

        if self.currency != expected_currency:
            raise ValueError(
                "Moneda inválida para el país: Colombia requiere COP y USA requiere USD"
            )

        return self


class Supplier(SupplierCreate):
    id: int
    updated_at: datetime


class SupplierRateUpdate(BaseModel):
    rate_per_unit: float = Field(gt=0)


class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class ProfileBase(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    phone: str | None = Field(default=None, min_length=3)
    address: str | None = Field(default=None, min_length=3)


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class Profile(ProfileBase):
    id: UUID
    user_id: UUID


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    profile: ProfileCreate | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None
    password: str | None = Field(default=None, min_length=8)


class UserRecord(UserBase):
    id: UUID
    hashed_password: str
    is_active: bool
    role: UserRole
    created_at: datetime


class UserRead(UserBase):
    id: UUID
    is_active: bool
    role: UserRole
    created_at: datetime
    profile: Profile | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AuthMeResponse(BaseModel):
    email: EmailStr
    role: UserRole
    profile: Profile | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class PasswordActionResponse(BaseModel):
    message: str
