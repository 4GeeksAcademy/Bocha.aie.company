import { ApiRequestError, apiFetch, requestJson } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

function responseWith(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("API utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, "fetch", { value: jest.fn(), writable: true, configurable: true });
  });

  it("returns JSON and sends the access token", async () => {
    setAccessToken(`header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }))}.signature`);
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValue(
      responseWith({ ok: true }, 200)
    );

    await expect(requestJson("/api/data", {}, { requiresAuth: true })).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      headers: expect.any(Headers),
    }));
    expect((fetchMock.mock.calls[0][1]?.headers as Headers).get("Authorization")).toContain("Bearer header.");
  });

  it("maps validation errors to field errors", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      responseWith({ detail: [{ loc: ["body", "username"], msg: "Email inválido" }] }, 422)
    );

    await expect(requestJson("/api/login")).rejects.toMatchObject({
      status: 422,
      message: "Email inválido",
      fieldErrors: { email: "Email inválido" },
    });
  });

  it("converts network failures into the user-facing API error", async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    await expect(apiFetch("/api/data")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("No pudimos comunicarnos"),
    } satisfies Partial<ApiRequestError>);
  });
});