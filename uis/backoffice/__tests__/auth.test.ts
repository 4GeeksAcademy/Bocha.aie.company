import {
  AUTH_TOKEN_KEY,
  buildLoginHref,
  getAccessToken,
  isPublicRoute,
  resolvePostAuthPath,
  setAccessToken,
} from "@/lib/auth";

function tokenWithExpiration(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}

describe("auth utilities", () => {
  beforeEach(() => localStorage.clear());

  it("returns a non-expired token and trims storage whitespace", () => {
    localStorage.setItem(AUTH_TOKEN_KEY, `  ${tokenWithExpiration(Math.floor(Date.now() / 1000) + 60)}  `);

    expect(getAccessToken()).toBe(localStorage.getItem(AUTH_TOKEN_KEY)?.trim());
  });

  it.each(["not-a-jwt", tokenWithExpiration(Math.floor(Date.now() / 1000) - 1)])(
    "clears malformed or expired tokens: %s",
    (token) => {
      setAccessToken(token);
      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    }
  );

  it("recognizes public routes and preserves only safe post-login paths", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(buildLoginHref("/incidents", "?filter=open")).toBe("/login?next=%2Fincidents%3Ffilter%3Dopen");
    expect(resolvePostAuthPath("//evil.example")).toBe("/");
    expect(resolvePostAuthPath("/incidents")).toBe("/incidents");
  });
});