import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { RouterContextProvider } from "react-router";
import { tokenContext } from "~/context/context";
import { action } from "~/routes/productsPage";
import { loader } from "~/routes/checkoutReturnPage";
import { server } from "./mocks/server";
import { apiBaseUrl } from "./mocks/handlers";

const id = "84c37378-234b-4b09-aa10-2be8109c9dde";
afterEach(() => sessionStorage.clear());

// Skapar samma autentiserade kontext som frontendens befintliga middleware använder.
function context() {
  const result = new RouterContextProvider();
  result.set(tokenContext, "customer-token");
  return result;
}

// Skapar ett formulär med produkt-id och antal utan kundnamn eller pris.
function checkoutRequest() {
  const body = new FormData();
  body.set("checkoutId", id);
  body.set("order", JSON.stringify({ items: [{ productId: 42, quantity: 2 }] }));
  return new Request("http://localhost/products", { method: "POST", body });
}

describe("Payment route integration", () => {
  it("opens Stripe through the gateway with the authenticated token", async () => {
    server.use(http.post(`${apiBaseUrl}/checkouts/${id}`, async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer customer-token");
      expect(await request.json()).toEqual({ items: [{ productId: 42, quantity: 2 }] });
      return HttpResponse.json({ url: "https://checkout.stripe.com/c/pay/cs_test_checkout" });
    }));
    const result = await action({ request: checkoutRequest(), context: context(), params: {},
      url: new URL("http://localhost/products"), pattern: "/products" });
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("https://checkout.stripe.com/c/pay/cs_test_checkout");
    expect((result as Response).headers.get("X-Remix-Reload-Document")
      ?? (result as Response).headers.get("X-React-Router-Reload-Document")).toBeTruthy();
  });

  it("keeps the cart and reports a failed checkout", async () => {
    sessionStorage.setItem("cart", "saved products");
    server.use(http.post(`${apiBaseUrl}/checkouts/${id}`, () => new HttpResponse(null, { status: 502 })));
    const result = await action({ request: checkoutRequest(), context: context(), params: {},
      url: new URL("http://localhost/products"), pattern: "/products" });
    expect(result).toMatchObject({ success: false });
    expect(sessionStorage.getItem("cart")).toBe("saved products");
  });

  it("uses backend status even when the return URL says success", async () => {
    server.use(http.get(`${apiBaseUrl}/checkouts/${id}`, () =>
      HttpResponse.json({ orderId: 1, status: "PENDING_PAYMENT" })));
    const result = await loader({
      request: new Request(`http://localhost/checkout/return?reservation_id=${id}&result=success`),
      context: context(),
      params: {},
      url: new URL(`http://localhost/checkout/return?reservation_id=${id}&result=success`),
      pattern: "/checkout/return",
    });
    expect(result.payment?.status).toBe("PENDING_PAYMENT");
  });

  it.each([404, 403, 502])("handles payment status HTTP %s without clearing local state", async (status) => {
    sessionStorage.setItem("cart", "saved products");
    sessionStorage.setItem("checkoutAttempt", JSON.stringify({ id, cart: "saved fingerprint" }));
    server.use(http.get(`${apiBaseUrl}/checkouts/${id}`, () => new HttpResponse(null, { status })));
    const result = await loader({
      request: new Request(`http://localhost/checkout/return?reservation_id=${id}`),
      context: context(), params: {},
      url: new URL(`http://localhost/checkout/return?reservation_id=${id}`), pattern: "/checkout/return",
    });
    expect(result).toMatchObject({ payment: null, missing: status === 404 });
    expect(sessionStorage.getItem("cart")).toBe("saved products");
    expect(sessionStorage.getItem("checkoutAttempt")).not.toBeNull();
  });
});
