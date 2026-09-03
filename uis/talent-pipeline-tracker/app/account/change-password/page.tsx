"use client";

import { useState } from "react";

import { SectionCard, FieldLabel } from "@/components/ui";
import { ApiRequestError, requestAuthJson } from "@/lib/auth";

type PasswordActionResponse = {
  message: string;
};

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const response = await requestAuthJson<PasswordActionResponse>(
        "/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
        {
          requiresAuth: true,
          fallbackMessage: "No se pudo cambiar la contraseña.",
        }
      );

      setFeedback(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      if (requestError instanceof ApiRequestError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[32px] border border-white/60 p-4 md:p-6">
        <SectionCard className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
            Cuenta
          </p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
              Cambiar contraseña
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
              Actualiza la contraseña de tu cuenta mientras estás autenticado.
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <FieldLabel>Contraseña actual</FieldLabel>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Nueva contraseña</FieldLabel>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <FieldLabel>Confirmar nueva contraseña</FieldLabel>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p>
            ) : null}
            {feedback ? (
              <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">{feedback}</p>
            ) : null}

            <div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </main>
  );
}
