import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { RouterContextProvider } from "react-router";
import { action } from "~/routes/registerPage";
import { server } from "./mocks/server";

// Skapar samma registreringsformulär som sidan skickar till sin server-action.
function submit(password = "password123", confirmation = password) {
  const body = new URLSearchParams({ username: "new@example.com", password, confirmPassword: confirmation });
  return action({ request: new Request("http://localhost/register", { method: "POST", body }),
    params: {}, context: new RouterContextProvider(), url: new URL("http://localhost/register"), pattern: "/register" } as Parameters<typeof action>[0]);
}

describe("account registration", () => {
  it("registers through the gateway and returns to login", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/register", async ({ request }) => {
      expect(await request.json()).toEqual({ username: "new@example.com", password: "password123" });
      return HttpResponse.json({ id: 1, username: "new@example.com" }, { status: 201 });
    }));
    const result = await submit();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/login?registered=1");
  });

  it("shows a duplicate account error", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/register", () => new HttpResponse(null, { status: 409 })));
    expect(await submit()).toMatchObject({ error: "An account with this email already exists." });
  });

  it("rejects mismatched passwords before calling the gateway", async () => {
    expect(await submit("password123", "different123")).toMatchObject({ error: "Passwords do not match." });
  });

  it("handles an unavailable gateway", async () => {
    server.use(http.post("http://gateway.test/gateway/auth/register", () => HttpResponse.error()));
    expect(await submit()).toMatchObject({ error: "Unable to reach the service. Please try again." });
  });
});
