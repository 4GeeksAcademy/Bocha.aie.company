from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
import re

VALID_STATUS = {"open", "in_progress", "resolved", "discarded"}
VALID_ORIGINS = {"customer", "branch", "internal"}
VALID_CATEGORIES = {
    "equipment_failure",
    "supply_issue",
    "customer_complaint",
    "staff_issue",
    "facility_issue",
    "pos_system",
    "delivery_issue",
    "other",
}
VALID_BRANCHES = {
    "central",
    "medellin_centro",
    "medellin_laureles",
    "medellin_envigado",
    "medellin_bello",
    "medellin_itagui",
    "bogota_chapinero",
    "bogota_usaquen",
    "cali_granada",
    "barranquilla_norte",
    "miami_doral",
    "miami_hialeah",
    "miami_kendall",
    "orlando_international",
    "fort_lauderdale",
}

ALLOWED_TRANSITIONS = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}


def _validate(value: str, allowed: Iterable[str], label: str) -> str:
    if value not in allowed:
        raise ValueError(f"{label} no válido")
    return value


def validate_status(value: str) -> str:
    return _validate(value, VALID_STATUS, "Estado")


def validate_origin(value: str) -> str:
    return _validate(value, VALID_ORIGINS, "Origen")


def validate_category(value: str) -> str:
    return _validate(value, VALID_CATEGORIES, "Categoría")


def validate_branch(value: str) -> str:
    return _validate(value, VALID_BRANCHES, "Sede")


def validate_transition(current: str, new: str) -> str:
    validate_status(new)
    if new not in ALLOWED_TRANSITIONS.get(current, set()):
        raise ValueError(f"Una incidencia {current} no puede pasar a {new}")
    return new


def validate_legacy_incident_row(row: dict[str, str]) -> list[str]:
    errors: list[str] = []
    incident_id = row.get("incident_id", "").strip()
    date = row.get("date", "").strip()
    location_id = row.get("location_id", "").strip()
    category = row.get("category", "").strip()
    description = row.get("description", "").strip()
    status = row.get("status", "").strip()
    reporter_id = row.get("reporter_id", "").strip()
    customer_id = row.get("customer_id", "").strip()
    score = row.get("satisfaction_score", "").strip()

    if not re.fullmatch(r"BRS-\d{6}", incident_id):
        errors.append("incident_id inválido")
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        errors.append("fecha inválida")
    if not re.fullmatch(r"(?:COL-(?:0[1-9]|10)|FLA-0[1-4])", location_id):
        errors.append("location_id inválido")
    if category not in {"CUSTOMER_COMPLAINT", "EQUIPMENT", "SUPPLY", "FOOD_QUALITY", "STAFF"}:
        errors.append("categoría CSV desconocida")
    if len(description) < 5:
        errors.append("descripción vacía o demasiado corta")
    if status not in {"OPEN", "CLOSED", "DISCARDED"}:
        errors.append("estado CSV desconocido")
    if not re.fullmatch(r"MGR-\d{2}", reporter_id):
        errors.append("reporter_id inválido")
    if customer_id and not re.fullmatch(r"CLI-\d{6}", customer_id):
        errors.append("customer_id inválido")
    if status == "CLOSED" and not score:
        errors.append("caso cerrado sin puntuación")
    if score:
        try:
            if not 1 <= int(score) <= 5:
                errors.append("puntuación fuera de rango")
        except ValueError:
            errors.append("puntuación inválida")
    return errors
