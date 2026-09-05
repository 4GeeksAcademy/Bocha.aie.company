import type {
  Incident,
  IncidentFilters,
  IncidentInput,
  IncidentSummary,
} from "@/types/incidents";

import { getAccessToken, resetSessionAndRedirect } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

type ApiError = { message?: string; detail?: string; error?: string };

export class IncidentApiError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "IncidentApiError";
    this.field = field;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    resetSessionAndRedirect();
    throw new Error("Debes iniciar sesión para continuar.");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as ApiError | T | null;
  if (response.status === 401) {
    resetSessionAndRedirect();
  }
  if (!response.ok) {
    const error = payload as ApiError | null;
    throw new IncidentApiError(
      error?.message ?? error?.detail ?? "No se pudo completar la operación.",
      (error as ApiError & { field?: string } | null)?.field,
    );
  }
  return payload as T;
}

export function getIncidents(filters: IncidentFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request<Incident[]>(`/api/incidents?${params}`);
}

export function createIncident(input: IncidentInput) {
  return request<Incident>("/api/incidents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateIncidentStatus(id: number, status: string) {
  return request<Incident>(`/api/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getIncidentSummary() {
  return request<IncidentSummary>("/api/incidents/summary");
}
