"""Seed masivo de inventario para medir latencias antes de cachear.

Uso (desde la raíz del repo):
    python -m services.api.seed_inventory_bulk          # inserta
    python -m services.api.seed_inventory_bulk --reset  # borra solo las filas BRS-BULK-*
"""
from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, insert
from sqlmodel import Session, col, func, select

from services.api.database import get_engine, get_users_table, init_inventory_db
from services.api.models import Ingredient, IngredientEntry, IngredientExit


SKU_PREFIX = "BRS-BULK-"
RNG_SEED = 20261021
INGREDIENTS_PER_COMBO = 3
ENTRIES_PER_INGREDIENT = (20, 70)
EXIT_RATIO = (0.5, 0.85)
LOCATIONS = range(1, 15)
HISTORY_DAYS = 365

# (categoría, unidad, nombres base, variantes, proveedores, rango de cantidad por entrada)
CATALOG = {
    "meat": (
        "kg",
        ["Picanha", "Entraña", "Chorizo santarrosano", "Costilla de res", "Pechuga de pollo",
         "Bondiola de cerdo", "Morcilla", "Brisket", "Punta de anca", "Short rib"],
        ["premium", "estándar", "madurada 21 días", "marinada"],
        ["Carnes del Valle S.A.", "Frigorífico Antioqueño",
            "MiamiMeat Co.", "Texas Prime Beef"],
        (5.0, 60.0),
    ),
    "produce": (
        "kg",
        ["Papa criolla", "Yuca", "Plátano maduro", "Cebolla cabezona", "Tomate chonto",
         "Aguacate Hass", "Mazorca", "Pimentón rojo", "Cilantro", "Limón Tahití"],
        ["orgánico", "convencional", "seleccionado"],
        ["Verduras La Cosecha", "Central Mayorista", "Florida Fresh Produce"],
        (10.0, 120.0),
    ),
    "sauce": (
        "litro",
        ["Chimichurri", "Salsa BBQ", "Ají de la casa", "Hogao", "Salsa de ajo",
         "Mayonesa de chipotle", "Salsa rosada"],
        ["clásica", "picante", "ahumada"],
        ["Condimentos El Sabor", "Salsas Artesanales Ltda.", "Southern Sauce Inc."],
        (2.0, 40.0),
    ),
    "beverage": (
        "unidad",
        ["Limonada de coco", "Gaseosa cola", "Agua sin gas", "Cerveza lager",
         "Jugo de lulo", "Té helado"],
        ["350 ml", "500 ml", "1.5 L"],
        ["Distribuidora RefriCol", "Bebidas del Sur", "Atlanta Beverages"],
        (24.0, 480.0),
    ),
    "packaging": (
        "unidad",
        ["Caja para llevar", "Bolsa kraft", "Vaso desechable",
            "Servilleta", "Cubiertos compostables"],
        ["S", "M", "L"],
        ["Empaques y Más", "PackUSA"],
        (100.0, 2000.0),
    ),
    "cleaning": (
        "litro",
        ["Desengrasante", "Desinfectante", "Jabón de manos", "Limpiavidrios"],
        ["industrial", "concentrado"],
        ["Limpiahogar Profesional", "CleanPro Supply"],
        (5.0, 50.0),
    ),
}


def _user_uuids() -> list[str]:
    users = get_users_table().all()
    if not users:
        raise RuntimeError(
            "No hay usuarios en TinyDB; crea al menos uno antes del seed.")
    return [str(user["id"]) for user in users]


def _bulk_count(session: Session) -> int:
    return session.exec(
        select(func.count()).select_from(Ingredient).where(
            col(Ingredient.sku).startswith(SKU_PREFIX))
    ).one()


def reset(session: Session) -> None:
    bulk_ids = select(Ingredient.id).where(
        col(Ingredient.sku).startswith(SKU_PREFIX))
    session.execute(delete(IngredientExit).where(
        col(IngredientExit.ingredient_id).in_(bulk_ids)))
    session.execute(delete(IngredientEntry).where(
        col(IngredientEntry.ingredient_id).in_(bulk_ids)))
    session.execute(delete(Ingredient).where(
        col(Ingredient.sku).startswith(SKU_PREFIX)))
    session.commit()


def seed(session: Session) -> dict[str, int]:
    rng = random.Random(RNG_SEED)
    users = _user_uuids()
    now = datetime.now(timezone.utc)

    ingredient_rows = []
    meta = []  # (sku, rango de cantidad, proveedores) en el mismo orden
    counter = 0
    for category, (unit, names, variants, suppliers, qty_range) in CATALOG.items():
        for name in names:
            for variant in variants:
                for country in ("CO", "US"):
                    if rng.random() > INGREDIENTS_PER_COMBO / 4:
                        continue
                    counter += 1
                    sku = f"{SKU_PREFIX}{category[:4].upper()}-{counter:04d}"
                    ingredient_rows.append({
                        "name": f"{name} {variant}",
                        "sku": sku,
                        "unit": unit,
                        "category": category,
                        "country": country,
                    })
                    meta.append((sku, qty_range, suppliers))

    session.execute(insert(Ingredient), ingredient_rows)
    session.commit()

    ids_by_sku = dict(
        session.exec(
            select(Ingredient.sku, Ingredient.id).where(
                col(Ingredient.sku).startswith(SKU_PREFIX))
        ).all()
    )

    entries, exits = [], []
    for sku, (low, high), suppliers in meta:
        ingredient_id = ids_by_sku[sku]
        inbound_total = 0.0
        for _ in range(rng.randint(*ENTRIES_PER_INGREDIENT)):
            quantity = round(rng.uniform(low, high), 2)
            inbound_total += quantity
            entries.append({
                "ingredient_id": ingredient_id,
                "quantity": quantity,
                "supplier_name": rng.choice(suppliers),
                "location_id": rng.choice(LOCATIONS),
                "created_at": now - timedelta(minutes=rng.randint(0, HISTORY_DAYS * 24 * 60)),
                "user_uuid": rng.choice(users),
            })

        # Las salidas nunca superan las entradas: el stock queda siempre positivo.
        outbound_budget = inbound_total * rng.uniform(*EXIT_RATIO)
        while outbound_budget > low:
            quantity = round(
                min(rng.uniform(low * 0.2, high * 0.5), outbound_budget), 2)
            outbound_budget -= quantity
            exits.append({
                "ingredient_id": ingredient_id,
                "quantity": quantity,
                "reason": "waste" if rng.random() < 0.12 else "consumption",
                "location_id": rng.choice(LOCATIONS),
                "created_at": now - timedelta(minutes=rng.randint(0, HISTORY_DAYS * 24 * 60)),
                "user_uuid": rng.choice(users),
            })

    for model, rows in ((IngredientEntry, entries), (IngredientExit, exits)):
        for start in range(0, len(rows), 2000):
            session.execute(insert(model), rows[start:start + 2000])
        session.commit()

    return {"ingredients": len(ingredient_rows), "entries": len(entries), "exits": len(exits)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true",
                        help="Borra solo las filas BRS-BULK-*")
    args = parser.parse_args()

    init_inventory_db()
    with Session(get_engine()) as session:
        if args.reset:
            reset(session)
            print("Filas BRS-BULK-* eliminadas.")
            return
        if _bulk_count(session):
            print("El seed masivo ya existe. Usa --reset para regenerarlo.")
            return
        print(f"Insertadas: {seed(session)}")


if __name__ == "__main__":
    main()
