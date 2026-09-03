"use client";

import { useState } from "react";

import { ApiRequestError, requestJson } from "@/lib/api";

type PasswordActionResponse = {
  message: string;
};

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const response = await requestJson<PasswordActionResponse>(
        "/backend/auth/change-password",
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
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">CUENTA</span>
        <h1>Cambiar contraseña</h1>
        <p>Actualiza la contraseña de tu cuenta mientras estás autenticado.</p>
      </header>

      <section className="card">
        <form className="profileForm" onSubmit={handleSubmit}>
          <label className="fullWidthField">
            Contraseña actual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

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
            Confirmar nueva contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {error ? <p className="error authMessage fullWidthField">{error}</p> : null}
          {feedback ? <p className="successMessage fullWidthField">{feedback}</p> : null}

          <div className="fullWidthField">
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
