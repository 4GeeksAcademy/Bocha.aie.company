"use client";

import { ApiRequestError } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { InventoryNav } from "@/components/inventory-nav";
import {
  createOutboundOrder,
  formatIngredientQuantity,
  getIngredient,
  INVENTORY_LOCATION_OPTIONS,
  INVENTORY_REASON_LABELS,
  isInventoryStockError,
  listIngredients,
  type Ingredient,
  type InventoryExitReason,
} from "@/lib/inventory";

type OutboundFormState = {
  ingredientId: string;
  quantity: string;
  reason: InventoryExitReason;
  locationId: string;
};

const initialFormState: OutboundFormState = {
  ingredientId: "",
  quantity: "",
  reason: "consumption",
  locationId: "",
};

export default function InventoryOutboundPage() {
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formState, setFormState] = useState<OutboundFormState>(initialFormState);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadIngredients() {
      setLoadingIngredients(true);
      setError("");

      try {
        const loaded = await listIngredients();

        if (!active) {
          return;
        }

        setIngredients(loaded);

        const ingredientFromQuery = searchParams.get("ingredient") ?? "";
        if (ingredientFromQuery && loaded.some((ingredient) => String(ingredient.id) === ingredientFromQuery)) {
          setFormState((current) => ({ ...current, ingredientId: ingredientFromQuery }));
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("No se pudo cargar el catálogo de ingredientes.");
        }
      } finally {
        if (active) {
          setLoadingIngredients(false);
        }
      }
    }

    void loadIngredients();

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadIngredientStock() {
      if (!formState.ingredientId) {
        setSelectedIngredient(null);
        setQuantityError("");
        return;
      }

      setLoadingStock(true);
      setError("");
      setQuantityError("");

      try {
        const ingredient = await getIngredient(Number(formState.ingredientId));

        if (!active) {
          return;
        }

        setError("");
        setSelectedIngredient(ingredient);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setSelectedIngredient(null);
        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("No se pudo consultar el stock actual del ingrediente.");
        }
      } finally {
        if (active) {
          setLoadingStock(false);
        }
      }
    }

    void loadIngredientStock();

    return () => {
      active = false;
    };
  }, [formState.ingredientId]);

  const requestedQuantity = Number(formState.quantity);
  const exceedsStock = Boolean(
    selectedIngredient
    && Number.isFinite(requestedQuantity)
    && requestedQuantity > selectedIngredient.current_stock
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setQuantityError("");
    setSuccess("");

    if (!formState.ingredientId || !formState.quantity || !formState.locationId) {
      setError("Completa ingrediente, cantidad y local donde ocurrió la salida.");
      return;
    }

    const quantity = Number(formState.quantity);
    const locationId = Number(formState.locationId);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setQuantityError("La cantidad de salida debe ser mayor que cero.");
      return;
    }

    if (!Number.isInteger(locationId) || locationId < 1 || locationId > 14) {
      setError("El local debe estar entre 1 y 14.");
      return;
    }

    setSubmitting(true);

    try {
      await createOutboundOrder({
        ingredient_id: Number(formState.ingredientId),
        quantity,
        reason: formState.reason,
        location_id: locationId,
      });

      const refreshedIngredient = await getIngredient(Number(formState.ingredientId));
      setSelectedIngredient(refreshedIngredient);
      setFormState((current) => ({ ...current, quantity: "", locationId: "", reason: "consumption" }));
      setSuccess(`Salida registrada correctamente para ${refreshedIngredient.name}.`);
    } catch (requestError) {
      if (isInventoryStockError(requestError)) {
        setQuantityError(requestError.message);
      } else if (requestError instanceof ApiRequestError && [400, 409].includes(requestError.status)) {
        setQuantityError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("No pudimos registrar la salida en este momento.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">CONSUMO Y MERMA</span>
        <h1>Registrar salida de ingredientes</h1>
        <p>
          Registra consumo operativo o merma indicando el local donde ocurrió la salida.
        </p>
        <InventoryNav current="outbound" />
      </header>

      <section className="card">
        <form className="supplierForm" onSubmit={handleSubmit}>
          <label>
            Ingrediente
            <select
              value={formState.ingredientId}
              onChange={(event) => {
                setError("");
                setQuantityError("");
                setSuccess("");
                setFormState((current) => ({ ...current, ingredientId: event.target.value }));
              }}
              disabled={loadingIngredients || submitting}
            >
              <option value="">Selecciona un ingrediente</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} · {ingredient.sku}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo de salida
            <select
              value={formState.reason}
              onChange={(event) => {
                setFormState((current) => ({ ...current, reason: event.target.value as InventoryExitReason }));
              }}
              disabled={submitting}
            >
              {Object.entries(INVENTORY_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cantidad de salida
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.quantity}
              onChange={(event) => {
                setQuantityError("");
                setFormState((current) => ({ ...current, quantity: event.target.value }));
              }}
              disabled={submitting}
              placeholder="Ej. 8"
            />
            {quantityError ? <span className="fieldError">{quantityError}</span> : null}
          </label>

          <label>
            Local
            <select
              value={formState.locationId}
              onChange={(event) => setFormState((current) => ({ ...current, locationId: event.target.value }))}
              disabled={submitting}
            >
              <option value="">Selecciona un local</option>
              {INVENTORY_LOCATION_OPTIONS.map((locationId) => (
                <option key={locationId} value={locationId}>
                  Local {locationId}
                </option>
              ))}
            </select>
          </label>

          <div className="fullWidthField inventoryCurrentStock">
            <strong>Stock disponible actual</strong>
            {loadingStock ? (
              <span className="inventorySecondaryText">Consultando stock del ingrediente...</span>
            ) : selectedIngredient ? (
              <>
                <span className="inventoryStockValue">
                  {formatIngredientQuantity(selectedIngredient.current_stock, selectedIngredient.unit)}
                </span>
                <span className="inventorySecondaryText">{selectedIngredient.name}</span>
              </>
            ) : (
              <span className="inventorySecondaryText">Selecciona un ingrediente para ver su stock neto.</span>
            )}
          </div>

          {exceedsStock ? (
            <p className="inventoryWarning fullWidthField">
              La cantidad solicitada supera el stock disponible. Revisa el valor antes de enviar.
            </p>
          ) : null}

          {success ? <p className="successMessage fullWidthField">{success}</p> : null}
          {error ? <p className="error fullWidthField">{error}</p> : null}

          <div className="fullWidthField">
            <button type="submit" disabled={submitting || loadingIngredients || loadingStock}>
              {submitting ? "Registrando salida..." : "Registrar salida"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}