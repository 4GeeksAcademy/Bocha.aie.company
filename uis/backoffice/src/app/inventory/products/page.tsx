"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { InventoryNav } from "@/components/inventory-nav";
import {
  formatIngredientQuantity,
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_COUNTRY_LABELS,
  listIngredients,
  type Ingredient,
} from "@/lib/inventory";

const CRITICAL_STOCK_THRESHOLD = 10;
const LOW_STOCK_THRESHOLD = 25;

function getStockLevel(stock: number): {
  label: string;
  className: string;
} {
  if (stock < CRITICAL_STOCK_THRESHOLD) {
    return { label: "Crítico", className: "badge badgeStockCritical" };
  }

  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: "Bajo", className: "badge badgeStockLow" };
  }

  return { label: "Estable", className: "badge badgeStockHealthy" };
}

export default function InventoryProductsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadIngredients() {
      setLoading(true);
      setError("");

      try {
        const loaded = await listIngredients();

        if (!active) {
          return;
        }

        setIngredients(loaded);
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("No pudimos cargar el inventario de ingredientes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadIngredients();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const { rows, criticalCount, lowCount } = useMemo(() => {
    let critical = 0;
    let low = 0;
    const classified = ingredients.map((ingredient) => {
      const stockLevel = getStockLevel(ingredient.current_stock);
      if (ingredient.current_stock < CRITICAL_STOCK_THRESHOLD) {
        critical += 1;
      } else if (ingredient.current_stock < LOW_STOCK_THRESHOLD) {
        low += 1;
      }
      return { ingredient, stockLevel };
    });
    return { rows: classified, criticalCount: critical, lowCount: low };
  }, [ingredients]);

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">INVENTARIO BRASALAND</span>
        <h1>Ingredientes y stock actual</h1>
        <p>
          Consulta el stock neto de cada ingrediente para las operaciones de Brasaland Digital.
        </p>
        <InventoryNav current="products" />
      </header>

      <section className="metrics">
        <article className="metric">
          <span>Ingredientes activos</span>
          <strong>{ingredients.length}</strong>
        </article>
        <article className="metric">
          <span>Stock crítico</span>
          <strong>{criticalCount}</strong>
        </article>
        <article className="metric">
          <span>Stock bajo</span>
          <strong>{lowCount}</strong>
        </article>
        <article className="metric">
          <span>Stock estable</span>
          <strong>{Math.max(ingredients.length - criticalCount - lowCount, 0)}</strong>
        </article>
      </section>

      <section className="card">
        <p className="inventoryGuide">
          <strong>Umbrales operativos:</strong> crítico por debajo de 10 unidades base, bajo entre 10 y 24.99,
          estable a partir de 25. El stock se calcula como entradas menos salidas.
        </p>

        {error ? (
          <div className="error">
            <p>{error}</p>
            <div>
              <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
                Reintentar
              </button>
              <span> </span>
              <Link href="/">Volver al inicio</Link>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="inventoryEmpty">Cargando inventario...</p>
        ) : null}

        {!loading && !error && ingredients.length === 0 ? (
          <p className="inventoryEmpty">No hay ingredientes registrados todavía.</p>
        ) : null}

        {!loading && !error && ingredients.length > 0 ? (
          <div className="tableWrapper">
            <table className="inventoryTable">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Categoría</th>
                  <th>Mercado</th>
                  <th>Stock actual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ ingredient, stockLevel }) => {
                  return (
                    <tr key={ingredient.id}>
                      <td>
                        <div className="inventoryProductMeta">
                          <strong>{ingredient.name}</strong>
                          <span className="inventorySecondaryText">{ingredient.sku}</span>
                          <span className="inventorySecondaryText">Unidad: {ingredient.unit}</span>
                        </div>
                      </td>
                      <td>{INGREDIENT_CATEGORY_LABELS[ingredient.category]}</td>
                      <td>{INGREDIENT_COUNTRY_LABELS[ingredient.country]}</td>
                      <td className="inventoryStockValue">
                        {formatIngredientQuantity(ingredient.current_stock, ingredient.unit)}
                      </td>
                      <td>
                        <span className={stockLevel.className}>{stockLevel.label}</span>
                      </td>
                      <td>
                        <div className="inlineActions">
                          <Link href={`/inventory/orders/inbound?ingredient=${ingredient.id}`} className="button">
                            Entrada
                          </Link>
                          <Link
                            href={`/inventory/orders/outbound?ingredient=${ingredient.id}`}
                            className="button secondaryButton"
                          >
                            Salida
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}