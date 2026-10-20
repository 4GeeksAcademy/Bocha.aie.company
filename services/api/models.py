from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)
from sqlmodel import Field as SQLField, SQLModel

from packages.shared.incidents import (
    validate_branch,
    validate_category,
    validate_origin,
    validate_status,
)


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


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = None
    phone: str | None = None
    address: str | None = None


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
    profile: ProfileRead | None = None


class UserListItem(UserBase):
    id: UUID
    is_active: bool
    role: UserRole
    created_at: datetime


class MessageResponse(BaseModel):
    message: str


class RootResponse(BaseModel):
    message: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AuthMeResponse(BaseModel):
    email: EmailStr
    role: UserRole
    profile: ProfileRead | None = None


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


class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    category: str
    status: str = Field(default="open", validate_default=True)
    origin: str
    branch: str
    source_id: str | None = None

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, value: str) -> str:
        return validate_category(value)

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, value: str) -> str:
        return validate_status(value)

    @field_validator("origin")
    @classmethod
    def origin_must_be_valid(cls, value: str) -> str:
        return validate_origin(value)

    @field_validator("branch")
    @classmethod
    def branch_must_be_valid(cls, value: str) -> str:
        return validate_branch(value)


class IncidentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, value: str) -> str:
        return validate_status(value)


class Incident(IncidentCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]


class BreakdownValue(BaseModel):
    count: int
    percentage: float


class SatisfactionResult(BaseModel):
    closed_cases: int
    scored_cases: int
    average: float | None
    scores: dict[str, int]


class IncidentAnalysisResult(BaseModel):
    company: str
    source_file: str
    total_records: int
    valid_records: int
    invalid_records: int
    invalid_breakdown: dict[str, int]
    by_category: dict[str, BreakdownValue]
    by_status: dict[str, BreakdownValue]
    satisfaction: SatisfactionResult


class Ingredient(SQLModel, table=True):
    id: int | None = SQLField(default=None, primary_key=True)
    name: str = SQLField(index=True)
    sku: str = SQLField(index=True, unique=True)
    unit: str
    category: str = SQLField(index=True)
    country: str = SQLField(index=True)


class IngredientEntry(SQLModel, table=True):
    id: int | None = SQLField(default=None, primary_key=True)
    ingredient_id: int = SQLField(foreign_key="ingredient.id", index=True)
    quantity: float = SQLField(gt=0)
    supplier_name: str
    location_id: int = SQLField(index=True)
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = SQLField(index=True)


class IngredientExit(SQLModel, table=True):
    id: int | None = SQLField(default=None, primary_key=True)
    ingredient_id: int = SQLField(foreign_key="ingredient.id", index=True)
    quantity: float = SQLField(gt=0)
    reason: str
    location_id: int = SQLField(index=True)
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(timezone.utc))
    user_uuid: str = SQLField(index=True)
