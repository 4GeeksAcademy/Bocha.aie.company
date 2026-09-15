import pytest
from fastapi import HTTPException

from services.api.models import IncidentCreate, SupplierCreate, SupplierCountry, SupplierCurrency, SupplierStatus
from services.api.routes import incidents, suppliers


def test_incident_create_and_list(isolated_database):
    payload = IncidentCreate(title="Caída", description="Descripción", category="equipment_failure", origin="branch", branch="medellin_centro")
    created = incidents.create_incident(payload)

    assert created.title == "Caída"
    assert incidents.list_incidents(None, None, None, None) == [created]


def test_incident_rejects_empty_title():
    with pytest.raises(ValueError):
        IncidentCreate(title="", description="Descripción", category="equipment_failure", origin="branch", branch="medellin_centro")


def test_incident_get_missing_fails(isolated_database):
    with pytest.raises(HTTPException) as error:
        incidents.get_incident(999)
    assert error.value.status_code == 404


def supplier_payload(**overrides):
    values = {"name": "Proveedor", "country": SupplierCountry.COLOMBIA, "categories": ["carne"], "rate_per_unit": 10, "currency": SupplierCurrency.COP, "status": SupplierStatus.ACTIVE}
    values.update(overrides)
    return SupplierCreate(**values)


def test_supplier_create_and_list(isolated_database):
    created = suppliers.create_supplier(supplier_payload())

    assert created.name == "Proveedor"
    assert suppliers.list_suppliers(None, None, None) == [created]


def test_supplier_rejects_currency_mismatch():
    with pytest.raises(ValueError, match="Moneda inválida"):
        supplier_payload(currency=SupplierCurrency.USD)


def test_supplier_get_missing_fails(isolated_database):
    with pytest.raises(HTTPException) as error:
        suppliers.get_supplier(999)
    assert error.value.status_code == 404