"use client";

import { useState } from "react";

import type { CandidateRecordInput } from "@/types/tracker";

import { FieldLabel } from "./ui";

type CandidateFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: CandidateRecordInput;
  successMessage: string;
  onSubmit: (values: CandidateRecordInput) => Promise<void>;
};

const emptyForm: CandidateRecordInput = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: 0,
};

function validate(values: CandidateRecordInput) {
  const errors: Partial<Record<keyof CandidateRecordInput, string>> = {};

  if (!values.full_name.trim()) {
    errors.full_name = "El nombre completo es obligatorio.";
  }

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Introduce un email válido.";
  }

  if (!values.phone.trim()) {
    errors.phone = "El teléfono es obligatorio.";
  }

  if (!values.position.trim()) {
    errors.position = "La vacante es obligatoria.";
  }

  if (Number.isNaN(values.experience_years) || values.experience_years < 0) {
    errors.experience_years = "Los años de experiencia deben ser 0 o más.";
  }

  return errors;
}

export function CandidateForm({
  title,
  description,
  submitLabel,
  initialValues,
  successMessage,
  onSubmit,
}: CandidateFormProps) {
  const [values, setValues] = useState<CandidateRecordInput>(initialValues ?? emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CandidateRecordInput, string>>>(
    {}
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<K extends keyof CandidateRecordInput>(key: K, value: CandidateRecordInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFeedback(null);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ type: "error", text: "Revisa los campos obligatorios antes de continuar." });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      setFeedback({ type: "success", text: successMessage });

      if (!initialValues) {
        setValues(emptyForm);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la candidatura en este momento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-stone-950">{title}</h3>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Nombre completo</FieldLabel>
          <input
            value={values.full_name}
            onChange={(event) => updateValue("full_name", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="Ej. Valentina Muñoz"
          />
          {errors.full_name ? <p className="mt-1 text-sm text-rose-700">{errors.full_name}</p> : null}
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            type="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="nombre@brasaland.com"
          />
          {errors.email ? <p className="mt-1 text-sm text-rose-700">{errors.email}</p> : null}
        </div>

        <div>
          <FieldLabel>Teléfono</FieldLabel>
          <input
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="+57 300 123 4567"
          />
          {errors.phone ? <p className="mt-1 text-sm text-rose-700">{errors.phone}</p> : null}
        </div>

        <div>
          <FieldLabel>Vacante</FieldLabel>
          <input
            value={values.position}
            onChange={(event) => updateValue("position", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="Manager de restaurante"
          />
          {errors.position ? <p className="mt-1 text-sm text-rose-700">{errors.position}</p> : null}
        </div>

        <div>
          <FieldLabel>Perfil de LinkedIn</FieldLabel>
          <input
            value={values.linkedin_url}
            onChange={(event) => updateValue("linkedin_url", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div>
          <FieldLabel>Enlace al CV</FieldLabel>
          <input
            value={values.cv_url}
            onChange={(event) => updateValue("cv_url", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div>
          <FieldLabel>Años de experiencia</FieldLabel>
          <input
            type="number"
            min="0"
            step="0.5"
            value={values.experience_years}
            onChange={(event) =>
              updateValue("experience_years", Number(event.target.value || 0))
            }
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
          {errors.experience_years ? (
            <p className="mt-1 text-sm text-rose-700">{errors.experience_years}</p>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p
          className={[
            "rounded-2xl px-4 py-3 text-sm",
            feedback.type === "success"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-100 text-rose-900",
          ].join(" ")}
        >
          {feedback.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}