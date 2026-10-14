from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Session, select

from services.api.database import get_engine, get_users_table, init_inventory_db
from services.api.models import Ingredient, IngredientEntry, IngredientExit


SEED_INGREDIENTS = [
    {
        "name": "Falda de ternera",
        "sku": "BRS-BEEF-001",
        "unit": "kg",
        "category": "meat",
        "country": "CO",
    },
    {
        "name": "Costilla de cerdo",
        "sku": "BRS-PORK-001",
        "unit": "kg",
        "category": "meat",
        "country": "US",
    },
    {
        "name": "Chimichurri",
        "sku": "BRS-SAUCE-001",
        "unit": "litro",
        "category": "sauce",
        "country": "CO",
    },
    {
        "name": "Salsa BBQ de la casa",
        "sku": "BRS-SAUCE-002",
        "unit": "litro",
        "category": "sauce",
        "country": "US",
    },
    {
        "name": "Yuca",
        "sku": "BRS-PROD-001",
        "unit": "kg",
        "category": "produce",
        "country": "CO",
    },
    {
        "name": "Caja para llevar (M)",
        "sku": "BRS-PKG-001",
        "unit": "unidad",
        "category": "packaging",
        "country": "CO",
    },
]

SEED_ENTRIES = [
    {
        "sku": "BRS-BEEF-001",
        "quantity": 50.0,
        "supplier_name": "Carnes del Valle S.A.",
        "location_id": 1,
        "created_at": datetime(2026, 1, 10, 14, 0, tzinfo=timezone.utc),
    },
    {
        "sku": "BRS-BEEF-001",
        "quantity": 30.0,
        "supplier_name": "Carnes del Valle S.A.",
        "location_id": 2,
        "created_at": datetime(2026, 1, 14, 15, 0, tzinfo=timezone.utc),
    },
    {
        "sku": "BRS-SAUCE-001",
        "quantity": 40.0,
        "supplier_name": "Salsas Artesanales Ltda.",
        "location_id": 3,
        "created_at": datetime(2026, 1, 11, 13, 0, tzinfo=timezone.utc),
    },
    {
        "sku": "BRS-PROD-001",
        "quantity": 100.0,
        "supplier_name": "MiamiMeat Co.",
        "location_id": 4,
        "created_at": datetime(2026, 1, 12, 16, 0, tzinfo=timezone.utc),
    },
]

SEED_EXITS = [
    {
        "sku": "BRS-BEEF-001",
        "quantity": 20.0,
        "reason": "consumption",
        "location_id": 1,
        "created_at": datetime(2026, 1, 15, 19, 0, tzinfo=timezone.utc),
    },
    {
        "sku": "BRS-SAUCE-001",
        "quantity": 5.0,
        "reason": "waste",
        "location_id": 3,
        "created_at": datetime(2026, 1, 16, 18, 0, tzinfo=timezone.utc),
    },
    {
        "sku": "BRS-PROD-001",
        "quantity": 25.0,
        "reason": "consumption",
        "location_id": 4,
        "created_at": datetime(2026, 1, 17, 18, 30, tzinfo=timezone.utc),
    },
]


def _get_seed_user_uuid() -> str:
    users = get_users_table().all()

    if not users:
        raise RuntimeError(
            "No hay usuarios en TinyDB. Crea al menos un usuario antes de sembrar inventario."
        )

    return str(users[0]["id"])


def _get_or_create_ingredient(session: Session, payload: dict[str, str]) -> Ingredient:
    ingredient = session.exec(
        select(Ingredient).where(Ingredient.sku == payload["sku"])
    ).first()

    if ingredient is not None:
        return ingredient

    ingredient = Ingredient(**payload)
    session.add(ingredient)
    session.commit()
    session.refresh(ingredient)
    return ingredient


def _entry_exists(session: Session, ingredient_id: int, payload: dict[str, object], user_uuid: str) -> bool:
    return session.exec(
        select(IngredientEntry).where(
            IngredientEntry.ingredient_id == ingredient_id,
            IngredientEntry.quantity == payload["quantity"],
            IngredientEntry.supplier_name == payload["supplier_name"],
            IngredientEntry.location_id == payload["location_id"],
            IngredientEntry.user_uuid == user_uuid,
            IngredientEntry.created_at == payload["created_at"],
        )
    ).first() is not None


def _exit_exists(session: Session, ingredient_id: int, payload: dict[str, object], user_uuid: str) -> bool:
    return session.exec(
        select(IngredientExit).where(
            IngredientExit.ingredient_id == ingredient_id,
            IngredientExit.quantity == payload["quantity"],
            IngredientExit.reason == payload["reason"],
            IngredientExit.location_id == payload["location_id"],
            IngredientExit.user_uuid == user_uuid,
            IngredientExit.created_at == payload["created_at"],
        )
    ).first() is not None


def run_seed() -> tuple[int, int, int]:
    init_inventory_db()
    user_uuid = _get_seed_user_uuid()

    with Session(get_engine()) as session:
        inserted_ingredients = 0
        inserted_entries = 0
        inserted_exits = 0

        ingredients_by_sku: dict[str, Ingredient] = {}

        for payload in SEED_INGREDIENTS:
            ingredient = session.exec(
                select(Ingredient).where(Ingredient.sku == payload["sku"])
            ).first()

            if ingredient is None:
                inserted_ingredients += 1

            ingredients_by_sku[payload["sku"]] = _get_or_create_ingredient(session, payload)

        for payload in SEED_ENTRIES:
            ingredient = ingredients_by_sku[payload["sku"]]

            if ingredient.id is None or _entry_exists(session, ingredient.id, payload, user_uuid):
                continue

            session.add(
                IngredientEntry(
                    ingredient_id=ingredient.id,
                    quantity=float(payload["quantity"]),
                    supplier_name=str(payload["supplier_name"]),
                    location_id=int(payload["location_id"]),
                    created_at=payload["created_at"],
                    user_uuid=user_uuid,
                )
            )
            inserted_entries += 1

        for payload in SEED_EXITS:
            ingredient = ingredients_by_sku[payload["sku"]]

            if ingredient.id is None or _exit_exists(session, ingredient.id, payload, user_uuid):
                continue

            session.add(
                IngredientExit(
                    ingredient_id=ingredient.id,
                    quantity=float(payload["quantity"]),
                    reason=str(payload["reason"]),
                    location_id=int(payload["location_id"]),
                    created_at=payload["created_at"],
                    user_uuid=user_uuid,
                )
            )
            inserted_exits += 1

        session.commit()

    return inserted_ingredients, inserted_entries, inserted_exits


if __name__ == "__main__":
    ingredients, entries, exits = run_seed()
    print(
        "Seeder de inventario completado. "
        f"Ingredientes: {ingredients}, entradas: {entries}, salidas: {exits}"
    )