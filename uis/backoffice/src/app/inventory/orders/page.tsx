"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { InventoryNav } from "@/components/inventory-nav";
import {
  formatIngredientQuantity,
  formatInventoryDate,
  INVENTORY_ORDER_TYPE_LABELS,
  INVENTORY_REASON_LABELS,
  listInventoryOrders,
  type InventoryOrder,
} from "@/lib/inventory";

export default function InventoryOrdersPage() {
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const loaded = await listInventoryOrders();

        if (!active) {
          return;
        }

        setOrders(loaded);
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("No se pudo cargar el historial de movimientos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">TRAZABILIDAD</span>
        <h1>Historial de movimientos</h1>
        <p>
          Consulta todas las entradas y salidas registradas, con el ingrediente y el usuario que creó cada movimiento.
        </p>
        <InventoryNav current="orders" />
      </header>

      <section className="card">
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

        {loading ? <p className="inventoryEmpty">Cargando historial...</p> : null}

        {!loading && !error && orders.length === 0 ? (
          <p className="inventoryEmpty">No hay movimientos registrados todavía.</p>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="tableWrapper">
            <table className="inventoryTable">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad</th>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Local</th>
                  <th>Creado</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={`${order.order_type}-${order.id}`}>
                    <td>
                      <div className="inventoryOrderMeta">
                        <strong>{order.ingredient.name}</strong>
                        <span className="inventorySecondaryText">{order.ingredient.sku}</span>
                      </div>
                    </td>
                    <td>{formatIngredientQuantity(order.quantity, order.ingredient.unit)}</td>
                    <td>
                      <span className={order.order_type === "inbound" ? "badge badgeInbound" : "badge badgeOutbound"}>
                        {INVENTORY_ORDER_TYPE_LABELS[order.order_type]}
                      </span>
                    </td>
                    <td>
                      <span className="inventorySecondaryText">
                        {order.order_type === "inbound"
                          ? `Proveedor: ${order.supplier_name ?? "No informado"}`
                          : `Motivo: ${order.reason ? INVENTORY_REASON_LABELS[order.reason] : "No informado"}`}
                      </span>
                    </td>
                    <td>Local {order.location_id}</td>
                    <td>{formatInventoryDate(order.created_at)}</td>
                    <td>{order.user_uuid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}