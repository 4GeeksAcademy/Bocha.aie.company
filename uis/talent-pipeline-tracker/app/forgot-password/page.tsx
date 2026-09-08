"use client";

import Link from "next/link";
import { useState } from "react";

import { SectionCard, FieldLabel } from "@/components/ui";
import { ApiRequestError, requestAuthJson } from "@/lib/auth";

type PasswordActionResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await requestAuthJson<PasswordActionResponse>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim() }),
        },
        {
          fallbackMessage: "No se pudo procesar la solicitud.",
        }
      );

      setFeedback(response.message);
      setSubmitted(true);
    } catch (requestError) {
      if (requestError instanceof ApiRequestError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto w-full max-w-xl rounded-[32px] border border-white/60 p-4 md:p-6">
        <SectionCard className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
              AUTH-03
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600 md:text-base">
                Escribe tu email y, si tienes una cuenta, te enviaremos un enlace para restablecerla.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={submitted}
                required
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)] disabled:opacity-60"
              />
            </div>

            {error ? (
              <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
                <p>{error}</p>
                <p className="mt-3">
                  Confirma el email e inténtalo otra vez o <Link href="/login" className="font-semibold underline">vuelve al login</Link>.
                </p>
              </div>
            ) : null}
            {feedback ? (
              <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">{feedback}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading || submitted}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          <p className="text-sm text-stone-600">
            ¿Ya la recordaste? <Link href="/login" className="font-semibold text-stone-900">Volver a login</Link>
          </p>
        </SectionCard>
      </div>
    </main>
  );
}
