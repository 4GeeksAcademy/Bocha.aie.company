import type {
  CandidateFilters,
  CandidateNote,
  CandidateRecord,
  CandidateRecordInput,
  CandidateRecordPatch,
  PaginatedResponse,
} from "@/types/tracker";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://playground.4geeks.com/tracker/api/v1";

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
  message?: string;
};

function normalizeCandidateInput(input: CandidateRecordInput) {
  return {
    ...input,
    linkedin_url: input.linkedin_url.trim() || null,
    cv_url: input.cv_url.trim() || null,
  };
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
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const apiError = payload as ApiErrorPayload;

  if (typeof apiError.error === "string") {
    return apiError.error;
  }

  if (typeof apiError.message === "string") {
    return apiError.message;
  }

  if (typeof apiError.detail === "string") {
    return apiError.detail;
  }

  if (Array.isArray(apiError.detail) && apiError.detail[0]?.msg) {
    return apiError.detail[0].msg;
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      buildErrorMessage(payload, "No se pudo completar la operación con el tracker.")
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