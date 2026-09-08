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

type RegisterFormState = {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
};

const initialForm: RegisterFormState = {
  email: "",
  password: "",
  name: "",
  phone: "",
  address: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<RegisterFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const profile = {
      name: form.name.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    const hasProfileData = Object.values(profile).some(Boolean);

    try {
      await requestAuthJson(
        "/users",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            profile: hasProfileData ? profile : null,
          }),
        },
        {
          fallbackMessage: "No se pudo crear la cuenta.",
        }
      );

      const loginBody = new URLSearchParams({
        username: form.email.trim(),
        password: form.password,
      });

      const loginResponse = await requestAuthJson<LoginResponse>(
        "/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: loginBody,
        },
        {
          fallbackMessage: "La cuenta se creó, pero no se pudo iniciar sesión automáticamente.",
        }
      );

      setAccessToken(loginResponse.access_token);
      router.replace(resolvePostAuthPath(searchParams.get("next")));
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setFieldErrors(requestError.fieldErrors);
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado al crear la cuenta.");
      }
    } finally {
      setLoading(false);
    }
  }

  function fieldError(field: keyof RegisterFormState | "profile.name" | "profile.phone" | "profile.address") {
    return fieldErrors[field] ?? "";
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto w-full max-w-2xl rounded-[32px] border border-white/60 p-4 md:p-6">
        <SectionCard className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
              AUTH-02
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
                Crear acceso al tracker
              </h1>
              <p className="mt-3 text-sm leading-6 text-stone-600 md:text-base">
                Registra tu cuenta con datos opcionales de perfil para operar dentro del pipeline.
              </p>
            </div>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              {fieldError("email") ? <p className="mt-1 text-sm text-rose-700">{fieldError("email")}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              {fieldError("password") ? (
                <p className="mt-1 text-sm text-rose-700">{fieldError("password")}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                autoComplete="name"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              {fieldError("profile.name") ? (
                <p className="mt-1 text-sm text-rose-700">{fieldError("profile.name")}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                autoComplete="tel"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              {fieldError("profile.phone") ? (
                <p className="mt-1 text-sm text-rose-700">{fieldError("profile.phone")}</p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                Dirección
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                autoComplete="street-address"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              {fieldError("profile.address") ? (
                <p className="mt-1 text-sm text-rose-700">{fieldError("profile.address")}</p>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 md:col-span-2">
                <p>{error}</p>
                <p className="mt-3">
                  Revisa los datos del formulario o <Link href="/login" className="font-semibold underline">vuelve al login</Link>.
                </p>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Registrarme"}
              </button>
            </div>
          </form>

          <p className="text-sm text-stone-600">
            ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-stone-900">Ir a login</Link>
          </p>
        </SectionCard>
      </div>
    </main>
  );
}