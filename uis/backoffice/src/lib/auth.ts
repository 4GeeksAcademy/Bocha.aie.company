export const AUTH_TOKEN_KEY = "brasaland-backoffice-access-token";

export const PUBLIC_ROUTES = ["/login", "/register"] as const;

export const DEFAULT_AUTHENTICATED_ROUTE = "/";

type JwtPayload = {
  exp?: number;
};

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
  return PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]);
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