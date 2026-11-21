import { ApiError, apiRequest, clearStoredToken, login, register, setStoredToken } from "@/lib/api";

const TOKEN_KEY = "trackflow-access-token";
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
  window.localStorage.clear();
});

afterAll(() => {
  global.fetch = originalFetch;
});

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("token storage", () => {
  it("stores and clears the auth token", () => {
    setStoredToken("jwt-token");
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("jwt-token");
    clearStoredToken();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("does not throw when browser storage is unavailable", () => {
    const browserWindow = globalThis.window;
    Reflect.deleteProperty(globalThis, "window");
    try {
      expect(() => setStoredToken("jwt-token")).not.toThrow();
      expect(() => clearStoredToken()).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
    }
  });
});

describe("login", () => {
  it("posts credentials and returns the issued token", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(200, {
      access_token: "issued-token", token_type: "bearer", expires_in: 1800,
    }));

    await expect(login("user@example.com", "valid-password-123")).resolves.toMatchObject({
      access_token: "issued-token",
    });
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/auth/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "valid-password-123" }),
    }));
  });

  it("maps invalid credentials into an API error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(401, { detail: "Credenciales no válidas." }));

    await expect(login("user@example.com", "wrong-password")).rejects.toMatchObject({
      name: "ApiError", status: 401,
    });
  });

  it("rejects login when the API URL is not configured", async () => {
    const configuredUrl = process.env.NEXT_PUBLIC_TRACKFLOW_API_URL;
    process.env.NEXT_PUBLIC_TRACKFLOW_API_URL = "";
    try {
      await jest.isolateModulesAsync(async () => {
        const { login: loginWithoutApiUrl } = await import("@/lib/api");
        await expect(loginWithoutApiUrl("user@example.com", "password")).rejects.toThrow(
          "NEXT_PUBLIC_TRACKFLOW_API_URL must be configured",
        );
      });
    } finally {
      process.env.NEXT_PUBLIC_TRACKFLOW_API_URL = configuredUrl;
    }
  });
});

describe("registration", () => {
  it("sends registration fields", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(201, { id: "user-id" }));
    await expect(register({ email: "new@example.com", password: "valid-password-123", name: "New User" })).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/users", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", password: "valid-password-123", name: "New User" }),
    }));
  });

  it("maps duplicate-email conflict to a field error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(409, { detail: "El email ya está registrado." }));
    await expect(register({ email: "duplicate@example.com", password: "valid-password-123" })).rejects.toMatchObject({
      status: 409,
      fieldErrors: { email: "El email ya está registrado." },
    } satisfies Partial<ApiError>);
  });
});

describe("authenticated API requests", () => {
  it("adds the stored bearer token on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(200, { ok: true }));

    await expect(apiRequest("/resource", "valid-token")).resolves.toEqual({ ok: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.get("Authorization")).toBe("Bearer valid-token");
  });

  it("rejects unauthorized responses and dispatches the session event", async () => {
    const unauthorized = jest.fn();
    window.addEventListener("trackflow:unauthorized", unauthorized);
    (global.fetch as jest.Mock).mockResolvedValue(response(401, { detail: "expired" }));

    await expect(apiRequest("/resource", "token")).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener("trackflow:unauthorized", unauthorized);
  });
});
