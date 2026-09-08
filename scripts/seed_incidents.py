from __future__ import annotations

import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from packages.shared.incidents import (  # noqa: E402
    validate_branch,
    validate_category,
    validate_status,
    validate_legacy_incident_row,
)
from services.api.database import get_incidents_table  # noqa: E402

CSV_PATH = Path(__file__).with_name("incidents-brasaland.csv")
STATUS_MAP = {"OPEN": "open", "CLOSED": "resolved", "DISCARDED": "discarded"}
CATEGORY_MAP = {
    "CUSTOMER_COMPLAINT": "customer_complaint",
    "EQUIPMENT": "equipment_failure",
    "SUPPLY": "supply_issue",
    "FOOD_QUALITY": "customer_complaint",
    "STAFF": "staff_issue",
}
BRANCH_MAP = {
    "COL-01": "medellin_centro",
    "COL-02": "medellin_laureles",
    "COL-03": "medellin_envigado",
    "COL-04": "medellin_bello",
    "COL-05": "medellin_itagui",
    "COL-06": "bogota_chapinero",
    "COL-07": "bogota_usaquen",
    "COL-08": "cali_granada",
    "COL-09": "barranquilla_norte",
    "COL-10": "central",
    "FLA-01": "miami_doral",
    "FLA-02": "miami_hialeah",
    "FLA-03": "miami_kendall",
    "FLA-04": "orlando_international",
}


def transform_row(row: dict[str, str]) -> dict[str, str]:
    legacy_errors = validate_legacy_incident_row(row)
    if legacy_errors:
        raise ValueError("; ".join(legacy_errors))

    source_id = row.get("incident_id", "").strip() or row.get("ticket_id", "").strip()
    description = row.get("description", "").strip()
    if not source_id:
        raise ValueError("falta incident_id")
    if not description:
        raise ValueError("descripción vacía")

    date = datetime.strptime(row.get("date", "").strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    status = STATUS_MAP.get(row.get("status", "").strip())
    category = CATEGORY_MAP.get(row.get("category", "").strip())
    branch = BRANCH_MAP.get(row.get("location_id", "").strip(), "central")

    if status is None:
        raise ValueError("estado CSV desconocido")
    if category is None:
        raise ValueError("categoría CSV desconocida")

    validate_status(status)
    validate_category(category)
    validate_branch(branch)
    return {
        "source_id": source_id,
        "title": description[:120].strip(),
        "description": description,
        "category": category,
        "status": status,
        "origin": "customer",
        "branch": branch,
        "created_at": date.isoformat(),
        "updated_at": date.isoformat(),
    }


def seed(csv_path: Path = CSV_PATH) -> tuple[int, int, list[dict[str, object]]]:
    if not csv_path.exists():
        raise FileNotFoundError(f"No existe el fichero CSV: {csv_path}")

    if not csv_path.is_file():
        raise ValueError(f"La ruta indicada no es un fichero: {csv_path}")

    if csv_path.suffix.lower() != ".csv":
        raise ValueError("El fichero de entrada debe tener extensión .csv")

    table = get_incidents_table()
    inserted = 0
    skipped = 0
    invalid: list[dict[str, object]] = []

    try:
        with csv_path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)

            if not reader.fieldnames:
                raise ValueError("El CSV no contiene cabeceras válidas")

            for line_number, row in enumerate(reader, start=2):
                try:
                    if row is None:
                        raise ValueError("fila vacía o malformada")

                    data = transform_row(row)
                    if table.search(lambda document: document.get("source_id") == data["source_id"]):
                        skipped += 1
                        continue
                    table.insert(data)
                    inserted += 1
                except (ValueError, TypeError) as error:
                    invalid.append({"line": line_number, "error": str(error)})
    except (OSError, csv.Error) as error:
        raise RuntimeError(f"No se pudo leer o procesar el CSV: {error}") from error

    return inserted, skipped, invalid


if __name__ == "__main__":
    try:
        inserted_count, skipped_count, invalid_rows = seed()
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    print("Seed terminado")
    print(f"Insertadas: {inserted_count}")
    print(f"Omitidas por existir: {skipped_count}")
    print(f"Inválidas: {len(invalid_rows)}")
    for invalid_row in invalid_rows:
        print(f"Fila {invalid_row['line']}: {invalid_row['error']}")
