import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { RouterContextProvider } from "react-router";
import { action } from "~/routes/welcomePage";
import { getSession, commitSession } from "~/sessions.server";
import { server } from "./mocks/server";

// Skapar en verklig signerad frontend-session för den inloggade användaren.
async function submit(authenticated = true) {
  const session = await getSession();
  if (authenticated) session.set("accessToken", "owner-token");
  const headers = { Cookie: (await commitSession(session)).split(";")[0] };
  const body = new URLSearchParams({ intent: "delete-account", password: "password123" });
  return action({ request: new Request("http://localhost/welcome", { method: "POST", headers, body }),
    params: {}, context: new RouterContextProvider(), url: new URL("http://localhost/welcome"), pattern: "/welcome" } as Parameters<typeof action>[0]);
}

describe("delete own account", () => {
  it("sends only the password with the session token and logs out after confirmation", async () => {
    server.use(http.delete("http://gateway.test/gateway/auth/account", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer owner-token");
      expect(await request.json()).toEqual({ password: "password123" });
      return new HttpResponse(null, { status: 204 });
    }));
    const result = await submit() as Response;
    expect(result.headers.get("Location")).toBe("/login?deleted=1");
    const cookie = result.headers.get("Set-Cookie")!;
    expect((await getSession(cookie.split(";")[0])).get("accessToken")).toBeUndefined();
    expect(cookie).toContain("Expires=Thu, 01 Jan 1970");
  });

  it("keeps the session when the password is rejected", async () => {
    server.use(http.delete("http://gateway.test/gateway/auth/account", () => new HttpResponse(null, { status: 401 })));
    expect(await submit()).toMatchObject({ error: expect.stringContaining("Incorrect password") });
  });

  it("does not report success when the gateway cannot be reached", async () => {
    server.use(http.delete("http://gateway.test/gateway/auth/account", () => HttpResponse.error()));
    expect(await submit()).toMatchObject({ error: expect.stringContaining("Unable to reach") });
  });

  it("redirects anonymous users to login without deleting anything", async () => {
    await expect(submit(false)).rejects.toMatchObject({ status: 302 });
  });
});
