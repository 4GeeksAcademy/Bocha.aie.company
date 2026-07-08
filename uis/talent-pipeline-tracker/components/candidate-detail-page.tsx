"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CandidateForm } from "@/components/candidate-form";
import { FieldLabel, SectionCard, StatusPill } from "@/components/ui";
import {
  createNote,
  deleteNote,
  getNotes,
  getRecord,
  patchRecord,
  replaceRecord,
} from "@/lib/tracker-api";
import {
  stageOptions,
  statusOptions,
  type CandidateNote,
  type CandidateRecord,
} from "@/types/tracker";

type CandidateDetailPageProps = {
  candidateId: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function labelFor(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function statusTone(status: CandidateRecord["status"]) {
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

export function CandidateDetailPage({ candidateId }: CandidateDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  const backHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/?${query}` : "/";
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      setLoading(true);
      setError(null);

      try {
        const record = await getRecord(candidateId);

        if (!ignore) {
          setCandidate(record);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el detalle de la candidatura."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    async function loadNotes() {
      setNotesLoading(true);
      setNotesError(null);

      try {
        const nextNotes = await getNotes(candidateId);

        if (!ignore) {
          setNotes(nextNotes);
        }
      } catch (loadError) {
        if (!ignore) {
          setNotesError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar las notas internas."
          );
        }
      } finally {
        if (!ignore) {
          setNotesLoading(false);
        }
      }
    }

    void loadRecord();
    void loadNotes();

    return () => {
      ignore = true;
    };
  }, [candidateId]);

  async function handlePatch(update: { status?: CandidateRecord["status"]; stage?: CandidateRecord["stage"] }) {
    const updatedCandidate = await patchRecord(candidateId, update);
    setCandidate(updatedCandidate);
    setRecordFeedback("Pipeline actualizado correctamente.");
  }

  async function handleStatusChange(nextStatus: CandidateRecord["status"]) {
    setStatusSaving(true);
    setRecordFeedback(null);

    try {
      await handlePatch({ status: nextStatus });
    } catch (updateError) {
      setRecordFeedback(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el estado."
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleStageChange(nextStage: CandidateRecord["stage"]) {
    setStageSaving(true);
    setRecordFeedback(null);

    try {
      await handlePatch({ stage: nextStage });
    } catch (updateError) {
      setRecordFeedback(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar la etapa."
      );
    } finally {
      setStageSaving(false);
    }
  }

  async function handleRecordReplace(values: {
    full_name: string;
    email: string;
    phone: string;
    position: string;
    linkedin_url: string;
    cv_url: string;
    experience_years: number;
  }) {
    const updated = await replaceRecord(candidateId, values);
    setCandidate(updated);
    setRecordFeedback("Ficha de candidatura actualizada correctamente.");
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!noteDraft.trim()) {
      setNoteFeedback("La nota no puede estar vacía.");
      return;
    }

    setNoteSaving(true);
    setNoteFeedback(null);

    try {
      await createNote(candidateId, noteDraft.trim());
      const nextNotes = await getNotes(candidateId);
      setNotes(nextNotes);
      setNoteDraft("");
      setNoteFeedback("Nota añadida al expediente.");
      setCandidate((current) =>
        current ? { ...current, notes_count: nextNotes.length } : current
      );
    } catch (noteError) {
      setNoteFeedback(
        noteError instanceof Error ? noteError.message : "No se pudo guardar la nota."
      );
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setNoteFeedback(null);

    try {
      await deleteNote(candidateId, noteId);
      const nextNotes = await getNotes(candidateId);
      setNotes(nextNotes);
      setNoteFeedback("Nota eliminada del expediente.");
      setCandidate((current) =>
        current ? { ...current, notes_count: nextNotes.length } : current
      );
    } catch (noteError) {
      setNoteFeedback(
        noteError instanceof Error ? noteError.message : "No se pudo eliminar la nota."
      );
    }
  }

  if (loading) {
    return (
      <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
        <div className="tracker-shell mx-auto flex w-full max-w-6xl rounded-[32px] border border-white/60 p-6">
          <SectionCard className="w-full text-center text-stone-600">
            Cargando expediente de candidatura...
          </SectionCard>
        </div>
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
        <div className="tracker-shell mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-[32px] border border-white/60 p-6">
          <Link href={backHref} className="text-sm font-semibold text-[color:var(--accent-strong)]">
            Volver al tablero
          </Link>
          <SectionCard className="bg-rose-100 text-rose-900">
            {error ?? "No se encontró la candidatura solicitada."}
          </SectionCard>
        </div>
      </main>
    );
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[32px] border border-white/60 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={backHref} className="text-sm font-semibold text-[color:var(--accent-strong)]">
              Volver al tablero de People & Culture
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
              {candidate.full_name}
            </h1>
            <p className="mt-2 text-base text-stone-600">{candidate.position}</p>
          </div>

          <StatusPill tone={statusTone(candidate.status)}>
            {labelFor(statusOptions, candidate.status)}
          </StatusPill>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">Email</p>
                <p className="mt-2 text-base text-stone-900">{candidate.email}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">Teléfono</p>
                <p className="mt-2 text-base text-stone-900">{candidate.phone}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">LinkedIn</p>
                <p className="mt-2 break-all text-base text-stone-900">
                  {candidate.linkedin_url ? (
                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                      {candidate.linkedin_url}
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">CV</p>
                <p className="mt-2 break-all text-base text-stone-900">
                  {candidate.cv_url ? (
                    <a href={candidate.cv_url} target="_blank" rel="noreferrer">
                      Ver CV
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">
                  Experiencia
                </p>
                <p className="mt-2 text-base text-stone-900">
                  {candidate.experience_years} años
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">
                  Aplicó el
                </p>
                <p className="mt-2 text-base text-stone-900">{formatDate(candidate.applied_at)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Estado</FieldLabel>
                <select
                  value={candidate.status}
                  disabled={statusSaving}
                  onChange={(event) =>
                    void handleStatusChange(event.target.value as CandidateRecord["status"])
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Etapa</FieldLabel>
                <select
                  value={candidate.stage}
                  disabled={stageSaving}
                  onChange={(event) =>
                    void handleStageChange(event.target.value as CandidateRecord["stage"])
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {stageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {recordFeedback ? (
              <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
                {recordFeedback}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-stone-500">
                Resumen interno
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Notas activas</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-950">{candidate.notes_count}</p>
                </div>
                <div className="rounded-2xl bg-white/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Última actualización</p>
                  <p className="mt-2 text-sm font-medium text-stone-900">{formatDate(candidate.updated_at)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
            >
              Refrescar vista
            </button>
          </SectionCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <SectionCard>
            <CandidateForm
              key={candidate.updated_at}
              title="Editar candidatura"
              description="Corrige los datos del expediente sin salir de la ficha del candidato."
              submitLabel="Guardar cambios"
              successMessage="Cambios guardados correctamente."
              initialValues={{
                full_name: candidate.full_name,
                email: candidate.email,
                phone: candidate.phone,
                position: candidate.position,
                linkedin_url: candidate.linkedin_url ?? "",
                cv_url: candidate.cv_url ?? "",
                experience_years: candidate.experience_years,
              }}
              onSubmit={handleRecordReplace}
            />
          </SectionCard>

          <SectionCard className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-stone-950">Notas internas</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Seguimiento operativo del equipo de People & Culture para entrevistas,
                disponibilidad y fit con la operación de Brasaland.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleAddNote}>
              <div>
                <FieldLabel>Nueva nota</FieldLabel>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={4}
                  placeholder="Ej. Disponible para entrevista en Miami esta semana."
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              {noteFeedback ? (
                <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
                  {noteFeedback}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={noteSaving}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {noteSaving ? "Guardando nota..." : "Añadir nota"}
              </button>
            </form>

            {notesLoading ? <p className="text-sm text-stone-600">Cargando notas...</p> : null}
            {notesError ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{notesError}</p> : null}

            {!notesLoading && !notesError ? (
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="rounded-2xl bg-white/75 px-4 py-5 text-sm text-stone-600">
                    Esta candidatura todavía no tiene notas internas.
                  </div>
                ) : (
                  notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-2xl border border-stone-200 bg-white/85 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-stone-800">
                            {note.content}
                          </p>
                          {note.created_at ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                              {formatDate(note.created_at)}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteNote(note.id)}
                          className="text-sm font-semibold text-rose-700 transition hover:text-rose-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : null}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}