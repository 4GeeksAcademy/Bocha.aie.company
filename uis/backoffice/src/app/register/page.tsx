"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiRequestError, requestJson } from "@/lib/api";
import { resolvePostAuthPath, setAccessToken } from "@/lib/auth";

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
      await requestJson(
        "/backend/users",
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

      const loginResponse = await requestJson<LoginResponse>(
        "/backend/auth/login",
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
    <main className="authPage">
      <section className="authCard card">
        <span className="eyebrow">AUTH-02</span>
        <h1>Crear acceso al backoffice</h1>
        <p>Registra tu usuario y enlaza los datos básicos del perfil para entrar al área privada.</p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              autoComplete="email"
              required
            />
            {fieldError("email") ? <small className="fieldError">{fieldError("email")}</small> : null}
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="new-password"
              minLength={8}
              required
            />
            {fieldError("password") ? <small className="fieldError">{fieldError("password")}</small> : null}
          </label>

          <label>
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              autoComplete="name"
            />
            {fieldError("profile.name") ? <small className="fieldError">{fieldError("profile.name")}</small> : null}
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              autoComplete="tel"
            />
            {fieldError("profile.phone") ? <small className="fieldError">{fieldError("profile.phone")}</small> : null}
          </label>

          <label>
            Dirección
            <input
              type="text"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              autoComplete="street-address"
            />
            {fieldError("profile.address") ? <small className="fieldError">{fieldError("profile.address")}</small> : null}
          </label>

          {error ? <p className="error authMessage">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="authFooter">
          ¿Ya tienes cuenta? <Link href="/login">Ir a login</Link>
        </p>
      </section>
    </main>
  );
}