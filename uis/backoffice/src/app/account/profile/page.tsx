"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { requestJson } from "@/lib/api";

type AuthMeResponse = {
  email: string;
  role: string;
  profile: {
    name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
};

type ProfileResponse = {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

type ProfileFormState = {
  name: string;
  phone: string;
  address: string;
};

export default function AccountProfilePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState<ProfileFormState>({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await requestJson<AuthMeResponse>(
          "/backend/auth/me",
          {},
          {
            requiresAuth: true,
            fallbackMessage: "No se pudo cargar el perfil actual.",
          }
        );

        if (!active) {
          return;
        }

        setEmail(response.email);
        setRole(response.role);
        setForm({
          name: response.profile?.name ?? "",
          phone: response.profile?.phone ?? "",
          address: response.profile?.address ?? "",
        });
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof Error) {
          setLoadError(requestError.message);
        } else {
          setLoadError("No pudimos cargar tu perfil en este momento.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setFeedback("");

    try {
      const updated = await requestJson<ProfileResponse>(
        "/backend/profiles/me",
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.name.trim() || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
          }),
        },
        {
          requiresAuth: true,
          fallbackMessage: "No se pudo guardar el perfil.",
        }
      );

      setForm({
        name: updated.name ?? "",
        phone: updated.phone ?? "",
        address: updated.address ?? "",
      });
      setFeedback("Perfil actualizado correctamente.");
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message);
      } else {
        setSaveError("No pudimos guardar los cambios del perfil.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <section className="card">
          <p>Cargando tu perfil...</p>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="container">
        <section className="card">
          <p className="error authMessage">{loadError}</p>
          <p>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)}>
              Reintentar
            </button>
          </p>
          <p className="authFooter">
            <Link href="/">Volver al inicio</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">CUENTA</span>
        <h1>Mi perfil</h1>
        <p>Gestiona tus datos de contacto vinculados a la sesión actual.</p>
      </header>

      <section className="card profileSummary">
        <div>
          <strong>Email</strong>
          <p>{email}</p>
        </div>
        <div>
          <strong>Rol</strong>
          <p>{role}</p>
        </div>
      </section>

      <section className="card">
        <h2>Datos de contacto</h2>

        <form className="profileForm" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>

          <label className="fullWidthField">
            Dirección
            <input
              type="text"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </label>

          {saveError ? (
            <>
              <p className="error authMessage fullWidthField">{saveError}</p>
              <p className="authFooter fullWidthField">
                Revisa los datos o <Link href="/">vuelve al inicio</Link>.
              </p>
            </>
          ) : null}
          {feedback ? <p className="successMessage fullWidthField">{feedback}</p> : null}

          <div className="fullWidthField">
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}