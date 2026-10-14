from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlmodel import SQLModel, Session

from services.api import auth
from services.api.database import get_engine
from services.api.models import Ingredient, IngredientEntry, IngredientExit, ProfileCreate, UserCreate
from services.api.routes.inventory import (
    create_inbound_order,
    create_outbound_order,
    list_orders,
    list_products,
)
from services.api.schemas import IngredientEntryCreate, IngredientExitCreate
from services.api.seed_inventory import run_seed
from services.api.users_service import create_user, get_user_by_email


def _make_user(email: str = "inventory@example.com"):
    payload = UserCreate(
        email=email,
        password="password123",
        profile=ProfileCreate(name="Inventario", phone="12345", address="Calle 10"),
    )
    create_user(payload, auth.hash_password("password123"))
    return auth.to_user_read(get_user_by_email(email))


@pytest.fixture
def inventory_session(tmp_path, monkeypatch):
    sqlite_path = tmp_path / "inventory.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{sqlite_path}")
    get_engine.cache_clear()

    engine = get_engine()
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    SQLModel.metadata.drop_all(engine)
    get_engine.cache_clear()


def test_list_products_returns_calculated_current_stock(inventory_session):
    ingredient = Ingredient(
        name="Falda de ternera",
        sku="BRS-BEEF-001",
        unit="kg",
        category="meat",
        country="CO",
    )
    inventory_session.add(ingredient)
    inventory_session.commit()
    inventory_session.refresh(ingredient)

    inventory_session.add(
        IngredientEntry(
            ingredient_id=ingredient.id,
            quantity=80,
            supplier_name="Carnes del Valle S.A.",
            location_id=1,
            user_uuid=str(uuid4()),
        )
    )
    inventory_session.add(
        IngredientExit(
            ingredient_id=ingredient.id,
            quantity=20,
            reason="consumption",
            location_id=1,
            user_uuid=str(uuid4()),
        )
    )
    inventory_session.commit()

    products = list_products(inventory_session)

    assert len(products) == 1
    assert products[0].current_stock == 60.0


def test_create_outbound_order_rejects_negative_stock(isolated_database, inventory_session):
    current_user = _make_user()
    ingredient = Ingredient(
        name="Chimichurri",
        sku="BRS-SAUCE-001",
        unit="litro",
        category="sauce",
        country="CO",
    )
    inventory_session.add(ingredient)
    inventory_session.commit()
    inventory_session.refresh(ingredient)

    with pytest.raises(HTTPException) as error:
        create_outbound_order(
            IngredientExitCreate(
                ingredient_id=ingredient.id,
                quantity=5,
                reason="waste",
                location_id=2,
            ),
            current_user,
            inventory_session,
        )

    assert error.value.status_code == 400
    assert "Insufficient stock for ingredient 'Chimichurri'" in error.value.detail


def test_list_orders_returns_product_data_and_user_uuid(isolated_database, inventory_session):
    current_user = _make_user("orders@example.com")
    ingredient = Ingredient(
        name="Yuca",
        sku="BRS-PROD-001",
        unit="kg",
        category="produce",
        country="CO",
    )
    inventory_session.add(ingredient)
    inventory_session.commit()
    inventory_session.refresh(ingredient)

    create_inbound_order(
        IngredientEntryCreate(
            ingredient_id=ingredient.id,
            quantity=40,
            supplier_name="Verduras La Cosecha",
            location_id=4,
        ),
        current_user,
        inventory_session,
    )
    create_outbound_order(
        IngredientExitCreate(
            ingredient_id=ingredient.id,
            quantity=10,
            reason="consumption",
            location_id=4,
        ),
        current_user,
        inventory_session,
    )

    orders = list_orders(inventory_session)

    assert len(orders) == 2
    assert {order.order_type for order in orders} == {"inbound", "outbound"}
    assert all(order.ingredient.sku == "BRS-PROD-001" for order in orders)
    assert all(order.user_uuid == str(current_user.id) for order in orders)


def test_seed_inventory_creates_expected_net_stock(isolated_database, inventory_session):
    _make_user("seed@example.com")

    ingredients, entries, exits = run_seed()
    products = list_products(inventory_session)
    stock_by_sku = {product.sku: product.current_stock for product in products}

    assert ingredients == 6
    assert entries == 4
    assert exits == 3
    assert stock_by_sku["BRS-BEEF-001"] == 60.0
    assert stock_by_sku["BRS-SAUCE-001"] == 35.0
    assert stock_by_sku["BRS-PROD-001"] == 75.0