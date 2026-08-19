"use client";

import { FormEvent, useEffect, useState } from "react";

type SupplierStatus = "active" | "suspended";
type SupplierCountry = "Colombia" | "USA";
type SupplierCurrency = "COP" | "USD";

type SupplierCategory =
  | "carne"
  | "verduras_y_hortalizas"
  | "salsas_y_condimentos"
  | "bebidas"
  | "packaging"
  | "productos_limpieza"
  | "lacteos"
  | "carbon_y_combustible";

type Supplier = {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_unit: number;
  currency: SupplierCurrency;
  updated_at: string;
  status: SupplierStatus;
  contact_email?: string | null;
  notes?: string | null;
};

type SupplierFormState = {
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_unit: string;
  currency: SupplierCurrency;
  status: SupplierStatus;
  contact_email: string;
  notes: string;
};

const CATEGORY_OPTIONS: SupplierCategory[] = [
  "carne",
  "verduras_y_hortalizas",
  "salsas_y_condimentos",
  "bebidas",
  "packaging",
  "productos_limpieza",
  "lacteos",
  "carbon_y_combustible",
];

const STATUS_OPTIONS: SupplierStatus[] = ["active", "suspended"];
const COUNTRY_OPTIONS: SupplierCountry[] = ["Colombia", "USA"];

function currencyForCountry(country: SupplierCountry): SupplierCurrency {
  return country === "Colombia" ? "COP" : "USD";
}

const initialForm: SupplierFormState = {
  name: "",
  country: "Colombia",
  categories: [],
  rate_per_unit: "",
  currency: "COP",
  status: "active",
  contact_email: "",
  notes: "",
};

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as { detail?: unknown };

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? message : null;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message))
      .join(" | ");
  }

  return fallback;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"" | SupplierCategory>("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formState, setFormState] = useState<SupplierFormState>(initialForm);
  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({});

  async function fetchSuppliers(filters: { country: string; category: "" | SupplierCategory }): Promise<Supplier[]> {
    const params = new URLSearchParams();

    if (filters.country.trim()) {
      params.set("country", filters.country.trim());
    }

    if (filters.category) {
      params.set("category", filters.category);
    }

    const query = params.toString();
    const url = query ? `/backend/suppliers?${query}` : "/backend/suppliers";

    const response = await fetch(url);
    const data = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new Error(readErrorMessage(data, "No se pudo cargar el directorio de proveedores."));
    }

    return (data as Supplier[]) ?? [];
  }

  async function loadSuppliers() {
    setError("");

    try {
      const loaded = await fetchSuppliers({
        country: countryFilter,
        category: categoryFilter,
      });

      setSuppliers(loaded);

      const nextDrafts: Record<number, string> = {};
      loaded.forEach((supplier) => {
        nextDrafts[supplier.id] = supplier.rate_per_unit.toString();
      });
      setRateDrafts(nextDrafts);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado al cargar proveedores.");
      }
    }
  }

  useEffect(() => {
    let active = true;

    async function syncSuppliersWithFilters() {
      try {
        const loaded = await fetchSuppliers({
          country: countryFilter,
          category: categoryFilter,
        });

        if (!active) {
          return;
        }

        setError("");
        setSuppliers(loaded);

        const nextDrafts: Record<number, string> = {};
        loaded.forEach((supplier) => {
          nextDrafts[supplier.id] = supplier.rate_per_unit.toString();
        });
        setRateDrafts(nextDrafts);
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("Ocurrió un error inesperado al cargar proveedores.");
        }
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    }

    void syncSuppliersWithFilters();

    return () => {
      active = false;
    };
  }, [countryFilter, categoryFilter]);

  function toggleCategory(category: SupplierCategory) {
    setFormState((previous) => {
      const alreadySelected = previous.categories.includes(category);
      return {
        ...previous,
        categories: alreadySelected
          ? previous.categories.filter((item) => item !== category)
          : [...previous.categories, category],
      };
    });
  }

  async function handleCreateSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!formState.name.trim() || !formState.rate_per_unit.trim()) {
      setFormError("Completá nombre y tarifa.");
      return;
    }

    if (formState.categories.length === 0) {
      setFormError("Seleccioná al menos una categoría.");
      return;
    }

    const parsedRate = Number(formState.rate_per_unit);

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      setFormError("La tarifa debe ser un número mayor que cero.");
      return;
    }

    setLoadingCreate(true);

    try {
      const response = await fetch("/backend/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name.trim(),
          country: formState.country,
          categories: formState.categories,
          rate_per_unit: parsedRate,
          currency: formState.currency,
          status: formState.status,
          contact_email: formState.contact_email.trim() || null,
          notes: formState.notes.trim() || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "No se pudo crear el proveedor."));
      }

      setFormState(initialForm);
      await loadSuppliers();
    } catch (requestError) {
      if (requestError instanceof Error) {
        setFormError(requestError.message);
      } else {
        setFormError("Ocurrió un error inesperado al crear el proveedor.");
      }
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleRateUpdate(supplierId: number) {
    const draft = rateDrafts[supplierId] ?? "";
    const parsed = Number(draft);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("La tarifa debe ser un número mayor que cero.");
      return;
    }

    setError("");

    try {
      const response = await fetch(`/backend/suppliers/${supplierId}/rate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rate_per_unit: parsed,
        }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "No se pudo actualizar la tarifa."));
      }

      const updated = data as Supplier;
      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
      setRateDrafts((previous) => ({ ...previous, [supplierId]: updated.rate_per_unit.toString() }));
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado al actualizar tarifa.");
      }
    }
  }

  async function handleStatusUpdate(supplierId: number, status: SupplierStatus) {
    setError("");

    try {
      const response = await fetch(`/backend/suppliers/${supplierId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(readErrorMessage(data, "No se pudo actualizar el estado."));
      }

      const updated = data as Supplier;
      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado al actualizar estado.");
      }
    }
  }

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">COMPRAS Y PROVEEDORES</span>
        <h1>Directorio de proveedores</h1>
        <p>Gestioná proveedores por país, categoría, tarifa y estado operativo.</p>
      </header>

      <section className="card">
        <h2>Registrar proveedor</h2>

        <form className="supplierForm" onSubmit={handleCreateSupplier}>
          <label>
            Nombre
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
              required
            />
          </label>

          <label>
            País
            <select
              value={formState.country}
              onChange={(event) => {
                const country = event.target.value as SupplierCountry;
                setFormState((previous) => ({
                  ...previous,
                  country,
                  currency: currencyForCountry(country),
                }));
              }}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tarifa por unidad
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formState.rate_per_unit}
              onChange={(event) => setFormState((previous) => ({ ...previous, rate_per_unit: event.target.value }))}
              required
            />
          </label>

          <label>
            Moneda
            <input type="text" value={formState.currency} readOnly />
          </label>

          <label>
            Estado
            <select
              value={formState.status}
              onChange={(event) => setFormState((previous) => ({ ...previous, status: event.target.value as SupplierStatus }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Email de contacto
            <input
              type="email"
              value={formState.contact_email}
              onChange={(event) => setFormState((previous) => ({ ...previous, contact_email: event.target.value }))}
              placeholder="proveedor@empresa.com"
            />
          </label>

          <label>
            Notas
            <input
              type="text"
              value={formState.notes}
              onChange={(event) => setFormState((previous) => ({ ...previous, notes: event.target.value }))}
              placeholder="Observaciones internas"
            />
          </label>

          <div className="categoriesSelector">
            <span>Categorías</span>

            <div className="categoryChips">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = formState.categories.includes(category);

                return (
                  <button
                    type="button"
                    key={category}
                    className={selected ? "chip chipSelected" : "chip"}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loadingCreate}>
            {loadingCreate ? "Guardando..." : "Crear proveedor"}
          </button>
        </form>

        {formError && <p className="error">{formError}</p>}
      </section>

      <section className="card">
        <h2>Filtros</h2>

        <div className="supplierFilters">
          <label>
            País
            <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
              <option value="">Todos</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label>
            Categoría
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "" | SupplierCategory)}>
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setCountryFilter("");
              setCategoryFilter("");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Listado de proveedores</h2>

        {error && <p className="error">{error}</p>}

        {loadingList ? (
          <p>Cargando proveedores...</p>
        ) : suppliers.length === 0 ? (
          <p>No hay proveedores para los filtros seleccionados.</p>
        ) : (
          <div className="tableWrapper">
            <table className="suppliersTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>País</th>
                  <th>Categorías</th>
                  <th>Tarifa</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th>Contacto</th>
                  <th>Actualizado</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.id}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.country}</td>
                    <td>{supplier.categories.join(", ")}</td>
                    <td>
                      <div className="inlineActions">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={rateDrafts[supplier.id] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setRateDrafts((previous) => ({ ...previous, [supplier.id]: value }));
                          }}
                        />
                        <button type="button" onClick={() => void handleRateUpdate(supplier.id)}>
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td>{supplier.currency}</td>
                    <td>
                      <div className="inlineActions">
                        <span className={supplier.status === "active" ? "badge badgeActive" : "badge badgeSuspended"}>
                          {supplier.status}
                        </span>
                        <select
                          value={supplier.status}
                          onChange={(event) => void handleStatusUpdate(supplier.id, event.target.value as SupplierStatus)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>{supplier.contact_email ?? "-"}</td>
                    <td>{new Date(supplier.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
