"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { InventoryNav } from "@/components/inventory-nav";
import {
  createInboundOrder,
  INVENTORY_LOCATION_OPTIONS,
  listIngredients,
  type Ingredient,
} from "@/lib/inventory";

type InboundFormState = {
  ingredientId: string;
  quantity: string;
  supplierName: string;
  locationId: string;
};

const initialFormState: InboundFormState = {
  ingredientId: "",
  quantity: "",
  supplierName: "",
  locationId: "",
};

export default function InventoryInboundPage() {
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formState, setFormState] = useState<InboundFormState>(initialFormState);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formState.ingredientId || !formState.quantity || !formState.supplierName.trim() || !formState.locationId) {
      setError("Completa ingrediente, cantidad, proveedor y local receptor.");
      return;
    }

    const quantity = Number(formState.quantity);
    const locationId = Number(formState.locationId);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("La cantidad recibida debe ser mayor que cero.");
      return;
    }

    if (!Number.isInteger(locationId) || locationId < 1 || locationId > 14) {
      setError("El local receptor debe estar entre 1 y 14.");
      return;
    }

    setSubmitting(true);

    try {
      await createInboundOrder({
        ingredient_id: Number(formState.ingredientId),
        quantity,
        supplier_name: formState.supplierName.trim(),
        location_id: locationId,
      });

      const ingredientName = ingredients.find((ingredient) => ingredient.id === Number(formState.ingredientId))?.name;
      setFormState(initialFormState);
      setSuccess(`Entrada registrada correctamente${ingredientName ? ` para ${ingredientName}` : ""}.`);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("No pudimos registrar la entrada en este momento.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">ABASTECIMIENTO</span>
        <h1>Registrar entrada de ingredientes</h1>
        <p>
          Documenta entregas de proveedores por local para mantener el stock actualizado.
        </p>
        <InventoryNav current="inbound" />
      </header>

      <section className="card">
        <form className="supplierForm" onSubmit={handleSubmit}>
          <label>
            Ingrediente
            <select
              value={formState.ingredientId}
              onChange={(event) => setFormState((current) => ({ ...current, ingredientId: event.target.value }))}
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
            Cantidad recibida
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.quantity}
              onChange={(event) => setFormState((current) => ({ ...current, quantity: event.target.value }))}
              disabled={submitting}
              placeholder="Ej. 25"
            />
          </label>

          <label>
            Proveedor
            <input
              type="text"
              value={formState.supplierName}
              onChange={(event) => setFormState((current) => ({ ...current, supplierName: event.target.value }))}
              disabled={submitting}
              placeholder="Ej. Carnes del Valle S.A."
            />
          </label>

          <label>
            Local receptor
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

          {success ? <p className="successMessage fullWidthField">{success}</p> : null}
          {error ? <p className="error fullWidthField">{error}</p> : null}

          <div className="fullWidthField">
            <button type="submit" disabled={submitting || loadingIngredients}>
              {submitting ? "Registrando entrada..." : "Registrar entrada"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}