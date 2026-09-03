"use client";

import Link from "next/link";
import { useState } from "react";

import { ApiRequestError, requestJson } from "@/lib/api";

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
      const response = await requestJson<PasswordActionResponse>(
        "/backend/auth/forgot-password",
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
    <main className="authPage">
      <section className="authCard card">
        <span className="eyebrow">AUTH-03</span>
        <h1>¿Olvidaste tu contraseña?</h1>
        <p>Escribe tu email y, si tienes una cuenta, te enviaremos un enlace para restablecerla.</p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={submitted}
              required
            />
          </label>

          {error ? <p className="error authMessage">{error}</p> : null}
          {feedback ? <p className="successMessage">{feedback}</p> : null}

          <button type="submit" disabled={loading || submitted}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <p className="authFooter">
          ¿Ya la recordaste? <Link href="/login">Volver a login</Link>
        </p>
      </section>
    </main>
  );
}
