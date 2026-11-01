import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { RouterContextProvider } from "react-router";
import { action } from "~/routes/loginPage";
import { server } from "./mocks/server";

// Skickar loginvyns formulär med vald åtgärd till dess riktiga server-action.
function submit(intent = "password-reset", password = "new-password", confirmation = password) {
  const body = new URLSearchParams({ intent, username: "demo@example.com", password, confirmPassword: confirmation });
  return action({ request: new Request("http://localhost/login", { method: "POST", body }), params: {},
    context: new RouterContextProvider(), url: new URL("http://localhost/login"), pattern: "/login" } as Parameters<typeof action>[0]);
}

describe("demo password reset on login page", () => {
  it("resets through the gateway without a token and returns to login", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/password-reset", async ({ request }) => {
      expect(request.headers.has("Authorization")).toBe(false);
      expect(await request.json()).toEqual({ username: "demo@example.com", newPassword: "new-password" });
      return new HttpResponse(null, { status: 204 });
    }));
    const result = await submit() as Response;
    expect(result.headers.get("Location")).toBe("/login?reset=1");
    expect(result.headers.has("Set-Cookie")).toBe(false);
  });

  it("rejects mismatched confirmation", async () => {
    expect(await submit("password-reset", "new-password", "different-password")).toMatchObject({ error: "Passwords do not match." });
  });

  it("rejects a short password", async () => {
    expect(await submit("password-reset", "short")).toMatchObject({ error: expect.stringContaining("at least 8") });
  });

  it("shows unknown account errors", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/password-reset", () => new HttpResponse(null, { status: 404 })));
    expect(await submit()).toMatchObject({ error: "No account was found with this email address." });
  });

  it("handles an unreachable gateway", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/password-reset", () => HttpResponse.error()));
    expect(await submit()).toMatchObject({ error: "Unable to reach the service. Please try again." });
  });

  it("preserves normal login and its session cookie", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/login", () => HttpResponse.json({
      accessToken: "test-token", expiresIn: 3600, subject: "demo@example.com", roles: ["ROLE_USER"],
    })));
    const result = await submit("login") as Response;
    expect(result.headers.get("Location")).toBe("/welcome");
    expect(result.headers.get("Set-Cookie")).toContain("__session=");
  });
});
