"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SectionCard } from "@/components/ui";
import { ApiRequestError, requestAuthJson, resolvePostAuthPath, setAccessToken } from "@/lib/auth";

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new URLSearchParams({
        username: email.trim(),
        password,
      });

      const response = await requestAuthJson<LoginResponse>(
        "/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
        {
          fallbackMessage: "No se pudo iniciar sesión.",
        }
      );

      setAccessToken(response.access_token);
      router.replace(resolvePostAuthPath(searchParams.get("next")));
    } catch (requestError) {
      if (requestError instanceof ApiRequestError || requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado al iniciar sesión.");
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
              AUTH-02
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
                Acceso al tracker
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600 md:text-base">
                Inicia sesión para consultar candidaturas, notas y movimientos del pipeline.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
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
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-sm text-stone-600">
            ¿Necesitas acceso? <Link href="/register" className="font-semibold text-stone-900">Crear cuenta</Link>
          </p>
        </SectionCard>
      </div>
    </main>
  );
}