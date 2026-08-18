from __future__ import annotations

from datetime import datetime, timezone

from tinydb import Query

from services.api.database import get_suppliers_table


INITIAL_SUPPLIERS = [
    {
        "name": "Carnes Andinas",
        "country": "Colombia",
        "product_categories": ["carne"],
        "rate": 4.5,
        "status": "activo",
    },
    {
        "name": "Verde Fresco SAS",
        "country": "Colombia",
        "product_categories": ["vegetales"],
        "rate": 2.9,
        "status": "activo",
    },
    {
        "name": "Salsas del Fuego",
        "country": "Colombia",
        "product_categories": ["salsas", "packaging"],
        "rate": 3.2,
        "status": "activo",
    },
    {
        "name": "Florida Prime Meats",
        "country": "Estados Unidos",
        "product_categories": ["carne"],
        "rate": 5.1,
        "status": "activo",
    },
    {
        "name": "Sunshine Produce",
        "country": "Estados Unidos",
        "product_categories": ["vegetales", "bebidas"],
        "rate": 3.7,
        "status": "activo",
    },
    {
        "name": "PackCo Latam",
        "country": "Colombia",
        "product_categories": ["packaging", "limpieza"],
        "rate": 2.4,
        "status": "suspendido",
    },
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_seed() -> int:
    table = get_suppliers_table()
    Supplier = Query()

    inserted = 0

    for supplier in INITIAL_SUPPLIERS:
        exists = table.contains(
            (Supplier.name == supplier["name"])
            & (Supplier.country == supplier["country"])
        )

        if exists:
            continue

        payload = {
            **supplier,
            "updated_at": _now_iso(),
        }
        table.insert(payload)
        inserted += 1

    return inserted


if __name__ == "__main__":
    inserted_count = run_seed()
    print(f"Seeder completado. Registros insertados: {inserted_count}")
