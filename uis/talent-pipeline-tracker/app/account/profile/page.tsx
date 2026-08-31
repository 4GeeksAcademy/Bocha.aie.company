"use client";

import { useEffect, useState } from "react";

import { FieldLabel, SectionCard } from "@/components/ui";
import { requestAuthJson } from "@/lib/auth";

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
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await requestAuthJson<AuthMeResponse>(
          "/auth/me",
          {},
          {
            requiresAuth: true,
            fallbackMessage: "No se pudo cargar el perfil actual.",
          }
        );

        if (ignore) {
          return;
        }

        setEmail(response.email);
        setRole(response.role);
        setForm({
          name: response.profile?.name ?? "",
          phone: response.profile?.phone ?? "",
          address: response.profile?.address ?? "",
        });
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el perfil actual."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const updated = await requestAuthJson<ProfileResponse>(
        "/profiles/me",
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
          fallbackMessage: "No se pudieron guardar los cambios del perfil.",
        }
      );

      setForm({
        name: updated.name ?? "",
        phone: updated.phone ?? "",
        address: updated.address ?? "",
      });
      setFeedback("Perfil actualizado correctamente.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudieron guardar los cambios del perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[32px] border border-white/60 p-4 md:p-6">
        <SectionCard className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[color:var(--accent-strong)]">
            Cuenta
          </p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
              Mi perfil
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
              Gestiona los datos del usuario autenticado que usa el tracker en operaciones diarias.
            </p>
          </div>
        </SectionCard>

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <SectionCard className="space-y-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">Email</p>
              <p className="mt-2 text-base text-stone-900">{loading ? "Cargando..." : email}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">Rol</p>
              <p className="mt-2 text-base text-stone-900">{loading ? "Cargando..." : role}</p>
            </div>
          </SectionCard>

          <SectionCard>
            {loading ? (
              <p className="text-stone-600">Cargando perfil...</p>
            ) : (
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <div>
                  <FieldLabel>Nombre</FieldLabel>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </div>

                <div>
                  <FieldLabel>Teléfono</FieldLabel>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Dirección</FieldLabel>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </div>

                {error ? (
                  <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900 md:col-span-2">{error}</p>
                ) : null}

                {feedback ? (
                  <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900 md:col-span-2">{feedback}</p>
                ) : null}

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}