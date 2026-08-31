import {
  buildLoginHref,
  clearAccessToken,
  getAccessToken,
} from "@/lib/auth";

type ApiErrorPayload = {
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
  error?: string;
  message?: string;
};

type RequestOptions = {
  requiresAuth?: boolean;
  fallbackMessage?: string;
};

export class ApiRequestError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function normalizeFieldPath(path: Array<string | number> | undefined): string | null {
  if (!path || path.length === 0) {
    return null;
  }

  const segments = path
    .map((segment) => String(segment))
    .filter((segment) => !["body", "query", "path"].includes(segment));

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "username") {
    segments[0] = "email";
  }

  return segments.join(".");
}

async function parseJsonSafely(response: Response): Promise<unknown> {
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

function buildApiError(payload: unknown, status: number, fallbackMessage: string): ApiRequestError {
  if (!payload || typeof payload !== "object") {
    return new ApiRequestError(fallbackMessage, status);
  }

  const apiPayload = payload as ApiErrorPayload;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(apiPayload.detail)) {
    for (const issue of apiPayload.detail) {
      if (!issue || typeof issue !== "object") {
        continue;
      }

      const field = normalizeFieldPath(issue.loc);
      const message = typeof issue.msg === "string" ? issue.msg : null;

      if (field && message && !fieldErrors[field]) {
        fieldErrors[field] = message;
      }
    }

    const firstMessage = apiPayload.detail.find((issue) => typeof issue?.msg === "string")?.msg;
    return new ApiRequestError(firstMessage ?? fallbackMessage, status, fieldErrors);
  }

  if (typeof apiPayload.detail === "string") {
    return new ApiRequestError(apiPayload.detail, status, fieldErrors);
  }

  if (typeof apiPayload.error === "string") {
    return new ApiRequestError(apiPayload.error, status, fieldErrors);
  }

  if (typeof apiPayload.message === "string") {
    return new ApiRequestError(apiPayload.message, status, fieldErrors);
  }

  return new ApiRequestError(fallbackMessage, status, fieldErrors);
}

function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextHref = buildLoginHref(window.location.pathname, window.location.search);
  window.location.replace(nextHref);
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<Response> {
  const { requiresAuth = false, fallbackMessage = "No se pudo completar la operación." } = options;
  const headers = new Headers(init.headers ?? undefined);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = getAccessToken();

    if (!token) {
      clearAccessToken();
      redirectToLogin();
      throw new ApiRequestError("Debes iniciar sesión para continuar.", 401);
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (response.status === 401 && requiresAuth) {
    clearAccessToken();
    redirectToLogin();
    throw new ApiRequestError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  }

  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw buildApiError(payload, response.status, fallbackMessage);
  }

  return response;
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const response = await apiFetch(path, init, options);
  const payload = await parseJsonSafely(response);
  return payload as T;
}