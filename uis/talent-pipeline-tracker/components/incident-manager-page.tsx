"use client";

import { useCallback, useEffect, useState } from "react";

import { SectionCard, StatusPill } from "@/components/ui";
import { createIncident, getIncidentSummary, getIncidents, IncidentApiError, updateIncidentStatus } from "@/lib/incidents-api";
import {
  branchOptions,
  categoryOptions,
  originOptions,
  statusOptions,
  type Incident,
  type IncidentInput,
  type IncidentSummary,
} from "@/types/incidents";

const initialForm: IncidentInput = {
  title: "",
  description: "",
  category: "customer_complaint",
  status: "open",
  origin: "branch",
  branch: "central",
};

const allowedTransitions: Record<string, string[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

function label(options: readonly (readonly [string, string])[], value: string) {
  return options.find(([option]) => option === value)?.[1] ?? value;
}

function statusLabel(value: string) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function statusTone(status: Incident["status"]) {
  if (status === "resolved") return "success" as const;
  if (status === "discarded") return "danger" as const;
  if (status === "in_progress") return "warning" as const;
  return "neutral" as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value));
}

export function IncidentManagerPage() {
  const [form, setForm] = useState<IncidentInput>(initialForm);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [filters, setFilters] = useState({ status: "", origin: "", branch: "" });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIncidents(await getIncidents(filters));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar las incidencias.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  async function loadSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await getIncidentSummary());
    } catch (loadError) {
      setSummaryError(loadError instanceof Error ? loadError.message : "No se pudo cargar el resumen.");
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadIncidents(), 0);
    return () => window.clearTimeout(timer);
  }, [filters, loadIncidents]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSummary(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateForm(field: keyof IncidentInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setFieldErrors({});
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setFormError("El título y la descripción son obligatorios.");
      setFieldErrors({
        ...(form.title.trim() ? {} : { title: "El título es obligatorio." }),
        ...(form.description.trim() ? {} : { description: "La descripción es obligatoria." }),
      });
      return;
    }

    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    setSuccess(null);
    try {
      await createIncident({ ...form, title: form.title.trim(), description: form.description.trim() });
      setForm(initialForm);
      setSuccess("Incidencia registrada correctamente.");
      await Promise.all([loadIncidents(), loadSummary()]);
    } catch (saveError) {
      if (saveError instanceof IncidentApiError && saveError.field) {
        setFieldErrors({ [saveError.field]: saveError.message });
      }
      setFormError(saveError instanceof Error ? saveError.message : "No se pudo registrar la incidencia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(incident: Incident, nextStatus: string) {
    const previousStatus = incident.status;
    setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, status: nextStatus as Incident["status"] } : item));
    try {
      await updateIncidentStatus(incident.id, nextStatus);
      await loadSummary();
    } catch (statusError) {
      setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, status: previousStatus } : item));
      setError(statusError instanceof Error ? statusError.message : "No se pudo actualizar el estado.");
    }
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[32px] border border-white/60 p-4 md:p-6">
        <header className="tracker-card rounded-[28px] px-6 py-7 md:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">Brasaland Digital / Operaciones</p>
          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">Centro de incidencias</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">Registra problemas de clientes, sedes y equipos, y acompaña cada caso hasta su resolución.</p>
            </div>
            <div className="rounded-[20px] bg-[color:var(--surface-strong)] px-5 py-4 md:min-w-36 md:text-right">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">Total</p>
              <p className="mt-1 text-3xl font-semibold text-stone-950">{summary?.total ?? "—"}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.5fr]">
          <SectionCard>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">Nueva incidencia</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">Registrar caso</h2>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div><label className="mb-2 block text-sm font-semibold text-stone-700">Título</label><input required value={form.title} onChange={(event) => updateForm("title", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]" placeholder="Ej. Error en terminal POS" />{fieldErrors.title ? <p className="mt-1 text-sm text-rose-700">{fieldErrors.title}</p> : null}</div>
              <div><label className="mb-2 block text-sm font-semibold text-stone-700">Descripción</label><textarea required rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]" placeholder="Describe qué ocurrió y cuándo." />{fieldErrors.description ? <p className="mt-1 text-sm text-rose-700">{fieldErrors.description}</p> : null}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Categoría" value={form.category} onChange={(value) => updateForm("category", value)} options={categoryOptions} error={fieldErrors.category} />
                <SelectField label="Origen" value={form.origin} onChange={(value) => updateForm("origin", value)} options={originOptions.map((option) => [option.value, option.label] as const)} error={fieldErrors.origin} />
              </div>
              <div className={form.origin === "branch" ? "rounded-2xl border-2 border-[color:var(--accent)] bg-orange-50 p-3" : ""}>
                <SelectField label="Sede relacionada" value={form.branch} onChange={(value) => updateForm("branch", value)} options={branchOptions} error={fieldErrors.branch} required />
                {form.origin === "branch" ? <p className="mt-2 text-xs font-medium text-[color:var(--accent-strong)]">Indica desde qué sede se reporta.</p> : null}
              </div>
              <div><label className="mb-2 block text-sm font-semibold text-stone-700">Estado inicial</label><select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
              {formError ? <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-900">{formError}</p> : null}
              {success ? <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-900">{success}</p> : null}
              <button disabled={saving} className="rounded-2xl bg-[color:var(--accent-strong)] px-4 py-3 font-semibold text-white transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Crear incidencia"}</button>
            </form>
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">Seguimiento</p><h2 className="mt-2 text-2xl font-semibold text-stone-950">Incidencias registradas</h2></div><button onClick={() => void loadIncidents()} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-[color:var(--accent)]">Actualizar</button></div>
            <div className="mt-6 grid gap-3 md:grid-cols-3"><Filter label="Estado" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[["", "Todos"], ...statusOptions.map((option) => [option.value, option.label] as const)]} /><Filter label="Origen" value={filters.origin} onChange={(value) => setFilters((current) => ({ ...current, origin: value }))} options={[["", "Todos"], ...originOptions.map((option) => [option.value, option.label] as const)]} /><Filter label="Sede" value={filters.branch} onChange={(value) => setFilters((current) => ({ ...current, branch: value }))} options={[["", "Todas"], ...branchOptions]} /></div>
            <div className="mt-6 grid gap-3">{loading ? <StateMessage> Cargando incidencias... </StateMessage> : null}{!loading && error ? <div className="rounded-2xl bg-rose-100 px-4 py-4 text-sm text-rose-900">{error}<button onClick={() => void loadIncidents()} className="mt-3 block font-semibold underline">Reintentar</button></div> : null}{!loading && !error && incidents.length === 0 ? <StateMessage>No hay incidencias para los filtros seleccionados.</StateMessage> : null}{!loading && !error ? incidents.map((incident) => <IncidentRow key={incident.id} incident={incident} onStatusChange={handleStatusChange} />) : null}</div>
          </SectionCard>
        </section>

        <SectionCard>
          <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">Lectura ejecutiva</p><h2 className="mt-2 text-2xl font-semibold text-stone-950">Resumen operativo</h2></div></div>
          {summaryLoading ? <StateMessage>Cargando resumen...</StateMessage> : null}{summaryError ? <p className="mt-5 rounded-2xl bg-rose-100 px-4 py-4 text-sm text-rose-900">{summaryError}</p> : null}{!summaryLoading && !summaryError && summary ? <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4"><SummaryGroup title="Por estado" values={summary.by_status} getLabel={statusLabel} /><SummaryGroup title="Por categoría" values={summary.by_category} getLabel={(value) => label(categoryOptions, value)} /><SummaryGroup title="Por origen" values={summary.by_origin} getLabel={(value) => label(originOptions.map((option) => [option.value, option.label] as const), value)} /><SummaryGroup title="Por sede" values={summary.by_branch} getLabel={(value) => label(branchOptions, value)} /></div> : null}
        </SectionCard>
      </div>
    </main>
  );
}

function SelectField({ label: fieldLabel, value, onChange, options, error, required = false }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; error?: string; required?: boolean }) { return <div><label className="mb-2 block text-sm font-semibold text-stone-700">{fieldLabel}</label><select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]">{options.map(([option, optionLabel]) => <option key={option} value={option}>{optionLabel}</option>)}</select>{error ? <p className="mt-1 text-sm text-rose-700">{error}</p> : null}</div>; }
function Filter({ label: fieldLabel, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) { return <SelectField label={fieldLabel} value={value} onChange={onChange} options={options} />; }
function StateMessage({ children }: { children: React.ReactNode }) { return <div className="rounded-2xl bg-white/65 px-4 py-10 text-center text-sm text-stone-600">{children}</div>; }
function IncidentRow({ incident, onStatusChange }: { incident: Incident; onStatusChange: (incident: Incident, status: string) => void }) { const next = allowedTransitions[incident.status] ?? []; return <article className="rounded-2xl border border-stone-200 bg-white/80 p-4"><div className="flex flex-col justify-between gap-4 md:flex-row"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-stone-950">{incident.title}</h3><StatusPill tone={statusTone(incident.status)}>{statusLabel(incident.status)}</StatusPill></div><p className="mt-2 text-sm text-stone-600">{incident.description}</p><p className="mt-3 text-xs font-medium text-stone-500">{label(categoryOptions, incident.category)} · {label(originOptions.map((option) => [option.value, option.label] as const), incident.origin)} · {label(branchOptions, incident.branch)} · {formatDate(incident.created_at)}</p></div>{next.length > 0 ? <select aria-label={`Cambiar estado de ${incident.title}`} value={incident.status} onChange={(event) => void onStatusChange(incident, event.target.value)} className="h-fit rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700"><option value={incident.status}>{statusLabel(incident.status)}</option>{next.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select> : null}</div></article>; }
function SummaryGroup({ title, values, getLabel }: { title: string; values: Record<string, number>; getLabel: (value: string) => string }) { return <div><h3 className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">{title}</h3><div className="mt-3 grid gap-2">{Object.entries(values).length === 0 ? <p className="text-sm text-stone-500">Sin datos</p> : Object.entries(values).map(([key, count]) => <div key={key} className="flex justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm"><span className="text-stone-600">{getLabel(key)}</span><strong className="text-stone-950">{count}</strong></div>)}</div></div>; }
