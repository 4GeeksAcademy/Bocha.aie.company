from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SupplierCategory(str, Enum):
    CARNE = "carne"
    VEGETALES = "vegetales"
    SALSAS = "salsas"
    BEBIDAS = "bebidas"
    PACKAGING = "packaging"
    LIMPIEZA = "limpieza"


class SupplierStatus(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2)
    country: str = Field(min_length=2)
    product_categories: list[SupplierCategory] = Field(min_length=1)
    rate: float = Field(gt=0)
    status: SupplierStatus


class Supplier(SupplierCreate):
    id: int
    updated_at: datetime


class SupplierRateUpdate(BaseModel):
    rate: float = Field(gt=0)


class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus
