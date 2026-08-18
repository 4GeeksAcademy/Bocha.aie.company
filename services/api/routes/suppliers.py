from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from tinydb.table import Document

from services.api.database import get_suppliers_table
from services.api.models import (
    Supplier,
    SupplierCategory,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierStatusUpdate,
)


router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _document_to_supplier(document: Document) -> Supplier:
    payload = dict(document)
    payload["id"] = document.doc_id
    return Supplier(**payload)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_supplier_document(supplier_id: int) -> Document:
    table = get_suppliers_table()
    document = table.get(doc_id=supplier_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return document


@router.post("", response_model=Supplier, status_code=201)
def create_supplier(payload: SupplierCreate) -> Supplier:
    table = get_suppliers_table()

    supplier_data = payload.model_dump(mode="json")
    supplier_data["updated_at"] = _now_iso()

    supplier_id = table.insert(supplier_data)
    document = table.get(doc_id=supplier_id)

    if document is None:
        raise HTTPException(status_code=500, detail="No se pudo crear el proveedor")

    return _document_to_supplier(document)


@router.get("", response_model=list[Supplier])
def list_suppliers(
    country: str | None = Query(default=None),
    category: SupplierCategory | None = Query(default=None),
) -> list[Supplier]:
    table = get_suppliers_table()
    documents = table.all()

    normalized_country = country.lower().strip() if country else None
    category_value = category.value if category else None

    filtered: list[Document] = []

    for document in documents:
        if normalized_country and document.get("country", "").lower().strip() != normalized_country:
            continue

        categories = document.get("product_categories", [])

        if category_value and category_value not in categories:
            continue

        filtered.append(document)

    return [_document_to_supplier(document) for document in filtered]


@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(supplier_id: int) -> Supplier:
    document = _find_supplier_document(supplier_id)
    return _document_to_supplier(document)


@router.patch("/{supplier_id}/rate", response_model=Supplier)
def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate) -> Supplier:
    table = get_suppliers_table()
    _find_supplier_document(supplier_id)

    table.update(
        {
            "rate": payload.rate,
            "updated_at": _now_iso(),
        },
        doc_ids=[supplier_id],
    )

    document = _find_supplier_document(supplier_id)
    return _document_to_supplier(document)


@router.patch("/{supplier_id}/status", response_model=Supplier)
def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate) -> Supplier:
    table = get_suppliers_table()
    _find_supplier_document(supplier_id)

    table.update(
        {
            "status": payload.status.value,
            "updated_at": _now_iso(),
        },
        doc_ids=[supplier_id],
    )

    document = _find_supplier_document(supplier_id)
    return _document_to_supplier(document)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int) -> dict[str, str]:
    table = get_suppliers_table()
    _find_supplier_document(supplier_id)

    table.remove(doc_ids=[supplier_id])

    return {"message": "Proveedor eliminado"}
