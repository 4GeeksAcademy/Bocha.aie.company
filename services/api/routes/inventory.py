from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from services.api.auth import get_current_active_user
from services.api.database import get_session
from services.api.models import Ingredient, IngredientEntry, IngredientExit, UserRead
from services.api.schemas import (
    IngredientCreate,
    IngredientEntryCreate,
    IngredientExitCreate,
    IngredientRead,
    IngredientSummary,
    InventoryOrderRead,
)


router = APIRouter(prefix="/inventory", tags=["inventory"])


def _get_ingredient_or_404(session: Session, ingredient_id: int) -> Ingredient:
    ingredient = session.get(Ingredient, ingredient_id)

    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    return ingredient


def _build_stock_maps(session: Session) -> tuple[dict[int, float], dict[int, float]]:
    entry_rows = session.exec(
        select(
            IngredientEntry.ingredient_id,
            func.sum(IngredientEntry.quantity),
        ).group_by(IngredientEntry.ingredient_id)
    ).all()
    exit_rows = session.exec(
        select(
            IngredientExit.ingredient_id,
            func.sum(IngredientExit.quantity),
        ).group_by(IngredientExit.ingredient_id)
    ).all()

    entries = {ingredient_id: float(total or 0) for ingredient_id, total in entry_rows}
    exits = {ingredient_id: float(total or 0) for ingredient_id, total in exit_rows}
    return entries, exits


def _calculate_stock(session: Session, ingredient_id: int) -> float:
    inbound_total = session.exec(
        select(func.coalesce(func.sum(IngredientEntry.quantity), 0)).where(
            IngredientEntry.ingredient_id == ingredient_id
        )
    ).one()
    outbound_total = session.exec(
        select(func.coalesce(func.sum(IngredientExit.quantity), 0)).where(
            IngredientExit.ingredient_id == ingredient_id
        )
    ).one()
    return float(inbound_total or 0) - float(outbound_total or 0)


def _to_ingredient_summary(ingredient: Ingredient) -> IngredientSummary:
    return IngredientSummary(
        id=ingredient.id,
        name=ingredient.name,
        sku=ingredient.sku,
        unit=ingredient.unit,
        category=ingredient.category,
        country=ingredient.country,
    )


def _to_ingredient_read(ingredient: Ingredient, current_stock: float) -> IngredientRead:
    return IngredientRead(
        id=ingredient.id,
        name=ingredient.name,
        sku=ingredient.sku,
        unit=ingredient.unit,
        category=ingredient.category,
        country=ingredient.country,
        current_stock=current_stock,
    )


def _to_inbound_order_read(order: IngredientEntry, ingredient: Ingredient) -> InventoryOrderRead:
    if order.id is None or ingredient.id is None:
        raise HTTPException(status_code=500, detail="Orden de entrada inválida")

    return InventoryOrderRead(
        id=order.id,
        order_type="inbound",
        ingredient=_to_ingredient_summary(ingredient),
        quantity=order.quantity,
        location_id=order.location_id,
        created_at=order.created_at,
        user_uuid=order.user_uuid,
        supplier_name=order.supplier_name,
    )


def _to_outbound_order_read(order: IngredientExit, ingredient: Ingredient) -> InventoryOrderRead:
    if order.id is None or ingredient.id is None:
        raise HTTPException(status_code=500, detail="Orden de salida inválida")

    return InventoryOrderRead(
        id=order.id,
        order_type="outbound",
        ingredient=_to_ingredient_summary(ingredient),
        quantity=order.quantity,
        location_id=order.location_id,
        created_at=order.created_at,
        user_uuid=order.user_uuid,
        reason=order.reason,
    )


@router.get("/products", response_model=list[IngredientRead])
def list_products(session: Session = Depends(get_session)) -> list[IngredientRead]:
    ingredients = session.exec(select(Ingredient).order_by(Ingredient.id)).all()
    entry_totals, exit_totals = _build_stock_maps(session)

    return [
        _to_ingredient_read(
            ingredient,
            entry_totals.get(ingredient.id or 0, 0.0) - exit_totals.get(ingredient.id or 0, 0.0),
        )
        for ingredient in ingredients
        if ingredient.id is not None
    ]


@router.post("/products", response_model=IngredientRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: IngredientCreate,
    current_user: UserRead = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> IngredientRead:
    del current_user

    existing = session.exec(select(Ingredient).where(Ingredient.sku == payload.sku)).first()

    if existing is not None:
        raise HTTPException(status_code=409, detail="Ya existe un ingrediente con ese sku")

    ingredient = Ingredient(**payload.model_dump())
    session.add(ingredient)
    session.commit()
    session.refresh(ingredient)

    return _to_ingredient_read(ingredient, 0.0)


@router.get("/products/{ingredient_id}", response_model=IngredientRead)
def get_product(ingredient_id: int, session: Session = Depends(get_session)) -> IngredientRead:
    ingredient = _get_ingredient_or_404(session, ingredient_id)
    return _to_ingredient_read(ingredient, _calculate_stock(session, ingredient_id))


@router.post("/orders/inbound", response_model=InventoryOrderRead, status_code=status.HTTP_201_CREATED)
def create_inbound_order(
    payload: IngredientEntryCreate,
    current_user: UserRead = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> InventoryOrderRead:
    _get_ingredient_or_404(session, payload.ingredient_id)

    order = IngredientEntry(
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        supplier_name=payload.supplier_name,
        location_id=payload.location_id,
        user_uuid=str(current_user.id),
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    ingredient = _get_ingredient_or_404(session, payload.ingredient_id)
    return _to_inbound_order_read(order, ingredient)


@router.post("/orders/outbound", response_model=InventoryOrderRead, status_code=status.HTTP_201_CREATED)
def create_outbound_order(
    payload: IngredientExitCreate,
    current_user: UserRead = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> InventoryOrderRead:
    ingredient = _get_ingredient_or_404(session, payload.ingredient_id)
    available = _calculate_stock(session, payload.ingredient_id)

    if payload.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock for ingredient '{ingredient.name}'. "
                f"Available: {available}, requested: {payload.quantity}."
            ),
        )

    order = IngredientExit(
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        reason=payload.reason,
        location_id=payload.location_id,
        user_uuid=str(current_user.id),
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    return _to_outbound_order_read(order, ingredient)


@router.get("/orders", response_model=list[InventoryOrderRead])
def list_orders(session: Session = Depends(get_session)) -> list[InventoryOrderRead]:
    inbound_orders = session.exec(
        select(IngredientEntry).order_by(IngredientEntry.created_at.desc())
    ).all()
    outbound_orders = session.exec(
        select(IngredientExit).order_by(IngredientExit.created_at.desc())
    ).all()

    ingredient_ids = {
        *[order.ingredient_id for order in inbound_orders],
        *[order.ingredient_id for order in outbound_orders],
    }
    ingredients = session.exec(
        select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
    ).all() if ingredient_ids else []
    ingredients_by_id = {
        ingredient.id: ingredient
        for ingredient in ingredients
        if ingredient.id is not None
    }

    orders = [
        *_map_inbound(inbound_orders, ingredients_by_id),
        *_map_outbound(outbound_orders, ingredients_by_id),
    ]
    orders.sort(key=lambda order: order.created_at, reverse=True)
    return orders


def _map_inbound(
    orders: list[IngredientEntry],
    ingredients_by_id: dict[int, Ingredient],
) -> list[InventoryOrderRead]:
    return [
        _to_inbound_order_read(order, ingredients_by_id[order.ingredient_id])
        for order in orders
        if order.ingredient_id in ingredients_by_id
    ]


def _map_outbound(
    orders: list[IngredientExit],
    ingredients_by_id: dict[int, Ingredient],
) -> list[InventoryOrderRead]:
    return [
        _to_outbound_order_read(order, ingredients_by_id[order.ingredient_id])
        for order in orders
        if order.ingredient_id in ingredients_by_id
    ]