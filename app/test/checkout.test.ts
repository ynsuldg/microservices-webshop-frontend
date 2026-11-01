import { afterEach, describe, expect, it } from "vitest";
import { checkoutAttempt, discardMissingCheckout, finishCheckout, pendingCheckoutId } from "~/utils/checkout";
import type { CartItemType } from "~/types/CartItemType";

const cart = [{ id: 42, quantity: 2 }] as CartItemType[];
afterEach(() => sessionStorage.clear());

describe("Checkout attempts", () => {
  it("discards only the matching missing reference and preserves the cart", () => {
    const savedCart = JSON.stringify(cart);
    sessionStorage.setItem("cart", savedCart);
    const attempt = checkoutAttempt(cart);
    discardMissingCheckout("another-reservation");
    expect(pendingCheckoutId()).toBe(attempt.id);
    discardMissingCheckout(attempt.id);
    expect(pendingCheckoutId()).toBeUndefined();
    expect(sessionStorage.getItem("cart")).toBe(savedCart);
  });
  it("reuses the same reservation after a lost response", () => {
    expect(checkoutAttempt(cart).id).toBe(checkoutAttempt(cart).id);
  });

  it("blocks a second order with a changed cart while payment is pending", () => {
    checkoutAttempt(cart);
    expect(() => checkoutAttempt([{ ...cart[0], quantity: 3 }])).toThrow("still pending");
  });

  it("keeps the cart and attempt until the backend confirms payment", () => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    const attempt = checkoutAttempt(cart);
    finishCheckout(attempt.id, "PENDING_PAYMENT");
    expect(sessionStorage.getItem("cart")).not.toBeNull();
    expect(checkoutAttempt(cart).id).toBe(attempt.id);
    finishCheckout(attempt.id, "PAID");
    expect(sessionStorage.getItem("cart")).toBeNull();
    expect(sessionStorage.getItem("checkoutAttempt")).toBeNull();
  });

  it("keeps products after expiration and permits a new attempt", () => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    const attempt = checkoutAttempt(cart);
    finishCheckout(attempt.id, "CANCELLED");
    expect(sessionStorage.getItem("cart")).not.toBeNull();
    expect(checkoutAttempt(cart).id).not.toBe(attempt.id);
  });

  it("does not empty a cart that was changed after checkout started", () => {
    const attempt = checkoutAttempt(cart);
    const changed = JSON.stringify([{ ...cart[0], quantity: 4 }]);
    sessionStorage.setItem("cart", changed);
    finishCheckout(attempt.id, "PAID");
    expect(sessionStorage.getItem("cart")).toBe(changed);
  });
});
