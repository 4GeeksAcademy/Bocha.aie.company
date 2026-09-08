import type {
  CandidateFilters,
  CandidateNote,
  CandidateRecord,
  CandidateRecordInput,
  CandidateRecordPatch,
  PaginatedResponse,
} from "@/types/tracker";

import {
  ApiRequestError,
  getAccessToken,
  resetSessionAndRedirect,
} from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://playground.4geeks.com/tracker/api/v1";

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
  message?: string;
};

const NETWORK_ERROR_MESSAGE =
  "No pudimos comunicarnos con el tracker. Revisa tu conexión e inténtalo de nuevo.";

function normalizeCandidateInput(input: CandidateRecordInput) {
  return {
    ...input,
    linkedin_url: input.linkedin_url.trim() || null,
    cv_url: input.cv_url.trim() || null,
  };
}

function normalizeUserFacingMessage(message: string | null | undefined, fallback: string) {
  const normalizedMessage = message?.trim();

  if (!normalizedMessage) {
    return fallback;
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
    return fallback;
  }

  if (lowerCaseMessage.includes("internal server error")) {
    return "El tracker tuvo un problema al procesar la solicitud. Inténtalo de nuevo.";
  }

  return normalizedMessage;
}

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string") {
    return normalizeUserFacingMessage(payload, fallback);
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const apiError = payload as ApiErrorPayload;

  if (typeof apiError.error === "string") {
    return normalizeUserFacingMessage(apiError.error, fallback);
  }

  if (typeof apiError.message === "string") {
    return normalizeUserFacingMessage(apiError.message, fallback);
  }

  if (typeof apiError.detail === "string") {
    return normalizeUserFacingMessage(apiError.detail, fallback);
  }

  if (Array.isArray(apiError.detail) && apiError.detail[0]?.msg) {
    return normalizeUserFacingMessage(apiError.detail[0].msg, fallback);
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  const token = getAccessToken();

  if (!token) {
    resetSessionAndRedirect();
    throw new ApiRequestError("Debes iniciar sesión para continuar.", 401);
  }

  headers.set("Authorization", `Bearer ${token}`);

  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiRequestError(
      normalizeUserFacingMessage(
        error instanceof Error ? error.message : null,
        NETWORK_ERROR_MESSAGE
      ),
      0
    );
  }

  if (response.status === 401) {
    resetSessionAndRedirect();
    throw new ApiRequestError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiRequestError(
      buildErrorMessage(payload, "No se pudo completar la operación con el tracker."),
      response.status
    );
  }

  return payload as T;
}

export async function getRecords(filters: CandidateFilters) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.stage) {
    params.set("stage", filters.stage);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  params.set("limit", "100");

  return request<PaginatedResponse<CandidateRecord>>(`/records?${params.toString()}`);
}

export async function getRecord(id: string) {
  return request<CandidateRecord>(`/records/${id}`);
}

export async function createRecord(input: CandidateRecordInput) {
  return request<CandidateRecord>("/records", {
    method: "POST",
    body: JSON.stringify(normalizeCandidateInput(input)),
  });
}

export async function replaceRecord(id: string, input: CandidateRecordInput) {
  return request<CandidateRecord>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeCandidateInput(input)),
  });
}

export async function patchRecord(id: string, input: CandidateRecordPatch) {
  return request<CandidateRecord>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getNotes(recordId: string) {
  const response = await request<
    CandidateNote[] | { data?: CandidateNote[]; notes?: CandidateNote[] }
  >(`/records/${recordId}/notes`);

  if (Array.isArray(response)) {
    return response;
  }

  return response.data ?? response.notes ?? [];
}

export async function createNote(recordId: string, content: string) {
  return request<CandidateNote>(`/records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteNote(recordId: string, noteId: string) {
  await request<void>(`/records/${recordId}/notes/${noteId}`, {
    method: "DELETE",
  });
}