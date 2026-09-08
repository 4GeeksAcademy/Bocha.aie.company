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

      const response = await requestJson<LoginResponse>(
        "/backend/auth/login",
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
    <main className="authPage">
      <section className="authCard card">
        <span className="eyebrow">AUTH-02</span>
        <h1>Acceso al backoffice</h1>
        <p>Inicia sesión con tu email corporativo para volver a las vistas internas.</p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <>
              <p className="error authMessage">{error}</p>
              <p className="authFooter">
                Verifica tus credenciales o <Link href="/forgot-password">restablece tu contraseña</Link>.
              </p>
            </>
          ) : null}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="authFooter">
          ¿Todavía no tienes cuenta? <Link href="/register">Crear usuario</Link>
        </p>
        <p className="authFooter">
          <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
      </section>
    </main>
  );
}