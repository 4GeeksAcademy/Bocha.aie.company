from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


VALID_CATEGORIES = {
    "meat",
    "produce",
    "sauce",
    "beverage",
    "packaging",
    "cleaning",
}
VALID_COUNTRIES = {"CO", "US"}


class IngredientBase(BaseModel):
    name: str = Field(min_length=1)
    sku: str = Field(min_length=3)
    unit: str = Field(min_length=1)
    category: str
    country: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_CATEGORIES:
            raise ValueError("category debe ser uno de: meat, produce, sauce, beverage, packaging, cleaning")
        return value

    @field_validator("country")
    @classmethod
    def validate_country(cls, value: str) -> str:
        if value not in VALID_COUNTRIES:
            raise ValueError("country debe ser CO o US")
        return value


class IngredientCreate(IngredientBase):
    pass


class IngredientRead(BaseModel):
    id: int
    name: str
    sku: str
    unit: str
    category: Literal["meat", "produce", "sauce", "beverage", "packaging", "cleaning"]
    country: Literal["CO", "US"]
    current_stock: float


class IngredientSummary(BaseModel):
    id: int
    name: str
    sku: str
    unit: str
    category: str
    country: str


class IngredientEntryCreate(BaseModel):
    ingredient_id: int
    quantity: float = Field(gt=0)
    supplier_name: str = Field(min_length=1)
    location_id: int = Field(ge=1, le=14)


class IngredientExitCreate(BaseModel):
    ingredient_id: int
    quantity: float = Field(gt=0)
    reason: Literal["consumption", "waste"]
    location_id: int = Field(ge=1, le=14)


class InventoryOrderRead(BaseModel):
    id: int
    order_type: Literal["inbound", "outbound"]
    ingredient: IngredientSummary
    quantity: float
    location_id: int
    created_at: datetime
    user_uuid: str
    supplier_name: str | None = None
    reason: Literal["consumption", "waste"] | None = None