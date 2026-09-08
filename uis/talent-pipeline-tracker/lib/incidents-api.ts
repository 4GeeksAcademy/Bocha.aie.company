import type {
  Incident,
  IncidentFilters,
  IncidentInput,
  IncidentSummary,
} from "@/types/incidents";

import { getAccessToken, resetSessionAndRedirect } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

const NETWORK_ERROR_MESSAGE =
  "No pudimos comunicarnos con el centro de incidencias. Revisa tu conexión e inténtalo de nuevo.";

type ApiError = { message?: string; detail?: string; error?: string };

export class IncidentApiError extends Error {
  field?: string;
  status?: number;
  constructor(message: string, field?: string, status?: number) {
    super(message);
    this.name = "IncidentApiError";
    this.field = field;
    this.status = status;
  }
}

function normalizeUserFacingMessage(message: string | null | undefined, fallbackMessage: string) {
  const normalizedMessage = message?.trim();

  if (!normalizedMessage) {
    return fallbackMessage;
  }

  const lowerCaseMessage = normalizedMessage.toLowerCase();

  if (
    lowerCaseMessage.includes("failed to fetch")
    || lowerCaseMessage.includes("networkerror")
    || lowerCaseMessage.includes("network request failed")
    || lowerCaseMessage.includes("load failed")
  ) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (
    lowerCaseMessage.includes("unexpected token")
    || normalizedMessage.startsWith("<!DOCTYPE")
    || normalizedMessage.startsWith("<html")
  ) {
    return fallbackMessage;
  }

  if (lowerCaseMessage.includes("internal server error")) {
    return "El servidor tuvo un problema al procesar la incidencia. Inténtalo de nuevo.";
  }

  return normalizedMessage;
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

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    throw new IncidentApiError(
      normalizeUserFacingMessage(
        error instanceof Error ? error.message : null,
        NETWORK_ERROR_MESSAGE
      )
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiError | T | null;
  if (response.status === 401) {
    resetSessionAndRedirect();
    throw new IncidentApiError("Tu sesión expiró. Inicia sesión de nuevo.", undefined, 401);
  }
  if (!response.ok) {
    const error = payload as ApiError | null;
    throw new IncidentApiError(
      normalizeUserFacingMessage(
        error?.message ?? error?.detail ?? error?.error,
        "No se pudo completar la operación."
      ),
      (error as ApiError & { field?: string } | null)?.field,
      response.status,
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
