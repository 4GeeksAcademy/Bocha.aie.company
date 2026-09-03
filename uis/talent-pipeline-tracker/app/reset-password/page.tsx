"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SectionCard, FieldLabel } from "@/components/ui";
import { ApiRequestError, requestAuthJson } from "@/lib/auth";

type PasswordActionResponse = {
  message: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no incluye un token válido. Solicita uno nuevo.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await requestAuthJson<PasswordActionResponse>(
        "/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token, new_password: newPassword }),
        },
        {
          fallbackMessage: "No se pudo restablecer la contraseña.",
        }
      );

      router.replace("/login?reset=success");
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
                Restablecer contraseña
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600 md:text-base">
                Elige una nueva contraseña para tu cuenta.
              </p>
            </div>
          </div>

          {!token ? (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
              Este enlace no es válido o ya expiró.{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Solicita uno nuevo
              </Link>
              .
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <FieldLabel>Confirmar contraseña</FieldLabel>
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

              {error ? (
                <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>
            </form>
          )}

          <p className="text-sm text-stone-600">
            <Link href="/login" className="font-semibold text-stone-900">Volver a login</Link>
          </p>
        </SectionCard>
      </div>
    </main>
  );
}
