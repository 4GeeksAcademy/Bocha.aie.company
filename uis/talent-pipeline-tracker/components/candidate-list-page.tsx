"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CandidateForm } from "@/components/candidate-form";
import { SectionCard, StatusPill } from "@/components/ui";
import { createRecord, getRecords } from "@/lib/tracker-api";
import { stageOptions, statusOptions, type CandidateRecord } from "@/types/tracker";

function badgeTone(status: CandidateRecord["status"]) {
  if (status === "selected") {
    return "success" as const;
  }

  if (status === "discarded") {
    return "danger" as const;
  }

  if (status === "in_progress") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getLabel<T extends { value: string; label: string }>(options: T[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function CandidateListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const filters = useMemo(
    () => ({
      status: searchParams.get("status") ?? "",
      stage: searchParams.get("stage") ?? "",
      search: searchParams.get("search") ?? "",
    }),
    [searchParams]
  );

  useEffect(() => {
    let ignore = false;

    async function loadRecords() {
      setLoading(true);
      setError(null);

      try {
        const response = await getRecords(filters);

        if (ignore) {
          return;
        }

        setRecords(response.data);
        setTotal(response.total);
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar las candidaturas del pipeline."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      ignore = true;
    };
  }, [filters, refreshIndex]);

  function updateFilter(key: "status" | "stage", value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    router.replace(nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname, {
      scroll: false,
    });
  }

  function updateSearch(value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      nextParams.set("search", value.trim());
    } else {
      nextParams.delete("search");
    }

    router.replace(nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname, {
      scroll: false,
    });
  }

  async function handleCreateCandidate(values: Parameters<typeof createRecord>[0]) {
    await createRecord(values);
    setRefreshIndex((current) => current + 1);
  }

  const currentQueryString = searchParams.toString();

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[32px] border border-white/60 p-4 md:p-6">
        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <SectionCard className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
                  Brasaland People & Culture
                </p>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
                    Talent Pipeline Tracker
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
                    Consola interna para seguir candidaturas de cocina, operaciones y liderazgo
                    en los restaurantes de Colombia y Florida sin salir del flujo de trabajo.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] bg-[color:var(--surface-strong)] px-5 py-4 text-right">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500">
                  Candidaturas activas
                </p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">{total}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_repeat(2,minmax(0,0.45fr))]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  Buscar por nombre o email
                </label>
                <input
                  value={filters.search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Ej. Ashley Turner o candidate@email.com"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(event) => updateFilter("status", event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="">Todos los estados</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  Etapa
                </label>
                <select
                  value={filters.stage}
                  onChange={(event) => updateFilter("stage", event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="">Todas las etapas</option>
                  {stageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-[24px] bg-white/65 px-5 py-12 text-center text-stone-600">
                  Cargando candidaturas del tracker...
                </div>
              ) : null}

              {!loading && error ? (
                <div className="rounded-[24px] bg-rose-100 px-5 py-6 text-rose-900">
                  {error}
                </div>
              ) : null}

              {!loading && !error ? (
                <div className="grid gap-4">
                  {records.length === 0 ? (
                    <div className="rounded-[24px] bg-white/65 px-5 py-12 text-center text-stone-600">
                      No hay candidaturas que coincidan con los filtros actuales.
                    </div>
                  ) : (
                    records.map((record) => (
                      <Link
                        key={record.id}
                        href={currentQueryString ? `/candidates/${record.id}?${currentQueryString}` : `/candidates/${record.id}`}
                        className="group rounded-[24px] border border-stone-200 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-xl"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-xl font-semibold text-stone-950">
                                {record.full_name}
                              </h2>
                              <StatusPill tone={badgeTone(record.status)}>
                                {getLabel(statusOptions, record.status)}
                              </StatusPill>
                            </div>
                            <p className="mt-2 text-sm font-medium text-stone-700">
                              {record.position}
                            </p>
                            <p className="mt-1 text-sm text-stone-500">{record.email}</p>
                          </div>

                          <div className="grid gap-3 text-sm text-stone-600 md:grid-cols-3 md:text-right">
                            <div>
                              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Etapa
                              </p>
                              <p className="mt-1 font-medium text-stone-900">
                                {getLabel(stageOptions, record.stage)}
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Notas
                              </p>
                              <p className="mt-1 font-medium text-stone-900">{record.notes_count}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                Aplicó
                              </p>
                              <p className="mt-1 font-medium text-stone-900">
                                {formatDate(record.applied_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard>
            <CandidateForm
              title="Registrar candidatura"
              description="Alta rápida para People & Culture cuando una candidatura llega por recomendación, feria de empleo o derivación interna."
              submitLabel="Guardar candidatura"
              successMessage="Candidatura registrada correctamente."
              onSubmit={handleCreateCandidate}
            />
          </SectionCard>
        </section>
      </div>
    </main>
  );
}