from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from tinydb.table import Document

from packages.shared.incidents import (
    validate_branch,
    validate_category,
    validate_origin,
    validate_status,
    validate_transition,
)
from services.api.database import get_incidents_table
from services.api.models import (
    Incident,
    IncidentCreate,
    IncidentStatusUpdate,
    IncidentSummary,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_incident(document: Document) -> Incident:
    payload = dict(document)
    payload["id"] = document.doc_id
    return Incident(**payload)


def _validate_payload(payload: IncidentCreate) -> None:
    validate_category(payload.category)
    validate_status(payload.status)
    validate_origin(payload.origin)
    validate_branch(payload.branch)


def _validation_error(field: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=422,
        detail={"error": "validation_error", "field": field, "message": message},
    )


def _find_document(incident_id: int) -> Document:
    document = get_incidents_table().get(doc_id=incident_id)
    if document is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Incidencia no encontrada"},
        )
    return document


@router.post("", response_model=Incident, status_code=201)
def create_incident(payload: IncidentCreate) -> Incident:
    try:
        _validate_payload(payload)
    except ValueError as error:
        field = {
            "Categoría": "category",
            "Estado": "status",
            "Origen": "origin",
            "Sede": "branch",
        }.get(str(error).split(" no válido")[0], "unknown")
        raise _validation_error(field, str(error)) from error

    now = _now()
    data = payload.model_dump()
    data["created_at"] = now.isoformat()
    data["updated_at"] = now.isoformat()
    incident_id = get_incidents_table().insert(data)
    return _to_incident(_find_document(incident_id))


@router.get("", response_model=list[Incident])
def list_incidents(
    status: str | None = Query(default=None),
    origin: str | None = Query(default=None),
    branch: str | None = Query(default=None),
    category: str | None = Query(default=None),
) -> list[Incident]:
    validators = ((status, validate_status), (origin, validate_origin), (branch, validate_branch), (category, validate_category))
    for value, validator in validators:
        if value is not None:
            try:
                validator(value)
            except ValueError as error:
                raise _validation_error("filter", str(error)) from error

    documents = get_incidents_table().all()
    filters = {key: value for key, value in (("status", status), ("origin", origin), ("branch", branch), ("category", category)) if value is not None}
    return [_to_incident(document) for document in documents if all(document.get(key) == value for key, value in filters.items())]


@router.get("/summary", response_model=IncidentSummary)
def incident_summary() -> IncidentSummary:
    incidents = [_to_incident(document) for document in get_incidents_table().all()]
    return IncidentSummary(
        total=len(incidents),
        by_status=dict(Counter(item.status for item in incidents)),
        by_category=dict(Counter(item.category for item in incidents)),
        by_origin=dict(Counter(item.origin for item in incidents)),
        by_branch=dict(Counter(item.branch for item in incidents)),
    )


@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: int) -> Incident:
    return _to_incident(_find_document(incident_id))


@router.patch("/{incident_id}/status", response_model=Incident)
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate) -> Incident:
    document = _find_document(incident_id)
    try:
        next_status = validate_transition(document["status"], payload.status)
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "invalid_status_transition",
                "field": "status",
                "message": str(error),
            },
        ) from error

    get_incidents_table().update(
        {"status": next_status, "updated_at": _now().isoformat()},
        doc_ids=[incident_id],
    )
    return _to_incident(_find_document(incident_id))
