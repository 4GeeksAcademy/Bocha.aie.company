export const AUTH_TOKEN_KEY = "brasaland-tracker-access-token";

const AUTH_API_BASE = "/backend";

export const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

export const DEFAULT_AUTHENTICATED_ROUTE = "/";

type JwtPayload = {
  exp?: number;
};

type ApiErrorPayload = {
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
  error?: string;
  message?: string;
};

type RequestOptions = {
  requiresAuth?: boolean;
  fallbackMessage?: string;
};

const NETWORK_ERROR_MESSAGE =
  "No pudimos comunicarnos con el servicio. Revisa tu conexión e inténtalo de nuevo.";

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

function normalizeUserFacingMessage(message: string | null | undefined, fallbackMessage: string): string {
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
    return "El servidor tuvo un problema al procesar la solicitud. Inténtalo de nuevo.";
  }

  return normalizedMessage;
}

function publicPathname(pathname: string): string {
  return pathname.split("?")[0] ?? pathname;
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
  if (typeof payload === "string") {
    return new ApiRequestError(
      normalizeUserFacingMessage(payload, fallbackMessage),
      status
    );
  }

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
    return new ApiRequestError(
      normalizeUserFacingMessage(apiPayload.detail, fallbackMessage),
      status,
      fieldErrors
    );
  }

  if (typeof apiPayload.error === "string") {
    return new ApiRequestError(
      normalizeUserFacingMessage(apiPayload.error, fallbackMessage),
      status,
      fieldErrors
    );
  }

  if (typeof apiPayload.message === "string") {
    return new ApiRequestError(
      normalizeUserFacingMessage(apiPayload.message, fallbackMessage),
      status,
      fieldErrors
    );
  }

  return new ApiRequestError(fallbackMessage, status, fieldErrors);
}

function parseJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload)) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload) {
    return false;
  }

  if (typeof payload.exp !== "number") {
    return false;
  }

  return payload.exp * 1000 > Date.now();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)?.trim();

  if (!token) {
    return null;
  }

  if (!isTokenValid(token)) {
    clearAccessToken();
    return null;
  }

  return token;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(publicPathname(pathname) as (typeof PUBLIC_ROUTES)[number]);
}

export function buildLoginHref(pathname: string, search = ""): string {
  const nextPath = `${pathname}${search}`;

  if (!nextPath || nextPath === "/") {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function resolvePostAuthPath(nextPath: string | null | undefined): string {
  if (!nextPath) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  if (isPublicRoute(nextPath)) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return nextPath;
}

export function resetSessionAndRedirect(): void {
  clearAccessToken();

  if (typeof window === "undefined") {
    return;
  }

  window.location.replace(buildLoginHref(window.location.pathname, window.location.search));
}

export async function authApiFetch(
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
      resetSessionAndRedirect();
      throw new ApiRequestError("Debes iniciar sesión para continuar.", 401);
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${AUTH_API_BASE}${path}`, {
      ...init,
      headers,
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

  if (response.status === 401 && requiresAuth) {
    resetSessionAndRedirect();
    throw new ApiRequestError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  }

  if (!response.ok) {
    const payload = await parseJsonSafely(response);
    throw buildApiError(payload, response.status, fallbackMessage);
  }

  return response;
}

export async function requestAuthJson<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const response = await authApiFetch(path, init, options);
  const payload = await parseJsonSafely(response);
  return payload as T;
}