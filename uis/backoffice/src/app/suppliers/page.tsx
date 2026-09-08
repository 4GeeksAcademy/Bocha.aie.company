"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { requestJson } from "@/lib/api";

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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"" | SupplierCategory>("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [listError, setListError] = useState("");
  const [rowError, setRowError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formState, setFormState] = useState<SupplierFormState>(initialForm);
  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({});
  const [savingRateId, setSavingRateId] = useState<number | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

    return requestJson<Supplier[]>(
      url,
      {},
      {
        requiresAuth: true,
        fallbackMessage: "No se pudo cargar el directorio de proveedores.",
      }
    );
  }

  async function loadSuppliers() {
    setLoadingList(true);
    setListError("");
    setRowError("");

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
        setListError(requestError.message);
      } else {
        setListError("No pudimos cargar el directorio de proveedores.");
      }
    } finally {
      setLoadingList(false);
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

        setListError("");
        setRowError("");
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
          setListError(requestError.message);
        } else {
          setListError("No pudimos cargar el directorio de proveedores.");
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
  }, [countryFilter, categoryFilter, reloadKey]);

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
    setFormSuccess("");

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
      await requestJson<Supplier>(
        "/backend/suppliers",
        {
          method: "POST",
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
        },
        {
          requiresAuth: true,
          fallbackMessage: "No se pudo crear el proveedor.",
        }
      );

      setFormState(initialForm);
      setFormSuccess("Proveedor registrado correctamente.");
      await loadSuppliers();
    } catch (requestError) {
      if (requestError instanceof Error) {
        setFormError(requestError.message);
      } else {
        setFormError("No pudimos crear el proveedor en este momento.");
      }
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleRateUpdate(supplierId: number) {
    const draft = rateDrafts[supplierId] ?? "";
    const parsed = Number(draft);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRowError("La tarifa debe ser un número mayor que cero.");
      return;
    }

    setRowError("");
    setSavingRateId(supplierId);

    try {
      const updated = await requestJson<Supplier>(
        `/backend/suppliers/${supplierId}/rate`,
        {
          method: "PATCH",
          body: JSON.stringify({
            rate_per_unit: parsed,
          }),
        },
        {
          requiresAuth: true,
          fallbackMessage: "No se pudo actualizar la tarifa.",
        }
      );

      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
      setRateDrafts((previous) => ({ ...previous, [supplierId]: updated.rate_per_unit.toString() }));
    } catch (requestError) {
      if (requestError instanceof Error) {
        setRowError(requestError.message);
      } else {
        setRowError("No pudimos actualizar la tarifa.");
      }
    } finally {
      setSavingRateId(null);
    }
  }

  async function handleStatusUpdate(supplierId: number, status: SupplierStatus) {
    setRowError("");
    setSavingStatusId(supplierId);

    try {
      const updated = await requestJson<Supplier>(
        `/backend/suppliers/${supplierId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        {
          requiresAuth: true,
          fallbackMessage: "No se pudo actualizar el estado.",
        }
      );

      setSuppliers((previous) => previous.map((supplier) => (supplier.id === supplierId ? updated : supplier)));
    } catch (requestError) {
      if (requestError instanceof Error) {
        setRowError(requestError.message);
      } else {
        setRowError("No pudimos actualizar el estado del proveedor.");
      }
    } finally {
      setSavingStatusId(null);
    }
  }

  function ErrorBlock({
    message,
    onRetry,
    secondaryAction,
  }: {
    message: string;
    onRetry?: () => void;
    secondaryAction?: React.ReactNode;
  }) {
    return (
      <div className="error">
        <p>{message}</p>
        <div>
          {onRetry ? (
            <button type="button" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
          {onRetry && secondaryAction ? <span> </span> : null}
          {secondaryAction}
        </div>
      </div>
    );
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

        {formError ? (
          <ErrorBlock
            message={formError}
            secondaryAction={<Link href="/">Volver al inicio</Link>}
          />
        ) : null}
        {formSuccess ? <p className="successMessage">{formSuccess}</p> : null}
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

        {listError ? (
          <ErrorBlock
            message={listError}
            onRetry={() => setReloadKey((current) => current + 1)}
            secondaryAction={<button type="button" onClick={() => { setCountryFilter(""); setCategoryFilter(""); }}>Limpiar filtros</button>}
          />
        ) : null}

        {rowError ? (
          <ErrorBlock
            message={rowError}
            secondaryAction={<Link href="/">Volver al inicio</Link>}
          />
        ) : null}

        {loadingList ? (
          <p>Cargando proveedores...</p>
        ) : !listError && suppliers.length === 0 ? (
          <p>No hay proveedores para los filtros seleccionados.</p>
        ) : !listError ? (
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
                          disabled={savingRateId === supplier.id}
                          onChange={(event) => {
                            const value = event.target.value;
                            setRateDrafts((previous) => ({ ...previous, [supplier.id]: value }));
                          }}
                        />
                        <button
                          type="button"
                          disabled={savingRateId === supplier.id}
                          onClick={() => void handleRateUpdate(supplier.id)}
                        >
                          {savingRateId === supplier.id ? "Guardando..." : "Guardar"}
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
                          disabled={savingStatusId === supplier.id}
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
        ) : null}
      </section>
    </main>
  );
}
