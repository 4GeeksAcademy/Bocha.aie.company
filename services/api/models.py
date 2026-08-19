from __future__ import annotations

from datetime import datetime
from enum import Enum

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
