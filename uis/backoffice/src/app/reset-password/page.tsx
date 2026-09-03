"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApiRequestError, requestJson } from "@/lib/api";

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
      await requestJson<PasswordActionResponse>(
        "/backend/auth/reset-password",
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
    <main className="authPage">
      <section className="authCard card">
        <span className="eyebrow">AUTH-03</span>
        <h1>Restablecer contraseña</h1>
        <p>Elige una nueva contraseña para tu cuenta.</p>

        {!token ? (
          <p className="error authMessage">
            Este enlace no es válido o ya expiró.{" "}
            <Link href="/forgot-password">Solicita uno nuevo</Link>.
          </p>
        ) : (
          <form className="authForm" onSubmit={handleSubmit}>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {error ? <p className="error authMessage">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        <p className="authFooter">
          <Link href="/login">Volver a login</Link>
        </p>
      </section>
    </main>
  );
}
