import type { CartItemType } from "~/types/CartItemType";

const key = "checkoutAttempt";
type Attempt = { id: string; cart: string };

// Jämför produkt-id och antal oberoende av varukorgens visningsordning.
export function cartFingerprint(items: Pick<CartItemType, "id" | "quantity">[]): string {
  return JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity })).sort((a, b) => a.id - b.id));
}

// Sparar försöket före nätverksanrop så att ett återförsök använder samma reservation.
export function checkoutAttempt(items: CartItemType[]): Attempt {
  const cart = cartFingerprint(items);
  const saved = sessionStorage.getItem(key);
  if (saved) {
    const attempt: Attempt = JSON.parse(saved);
    if (attempt.cart !== cart) {
      throw new Error("An earlier checkout is still pending. Check its payment status before changing your order.");
    }
    return attempt;
  }
  const attempt = { id: crypto.randomUUID(), cart };
  sessionStorage.setItem(key, JSON.stringify(attempt));
  return attempt;
}

// Tar bort endast det avslutade försöket och tömmer motsvarande varukorg efter bekräftad betalning.
export function finishCheckout(id: string, status: string): void {
  if (status !== "PAID" && status !== "CANCELLED") return;
  const saved = sessionStorage.getItem(key);
  if (!saved) return;
  const attempt: Attempt = JSON.parse(saved);
  if (attempt.id !== id) return;
  const cart = JSON.parse(sessionStorage.getItem("cart") ?? "[]") as CartItemType[];
  if (status === "PAID" && cartFingerprint(cart) === attempt.cart) sessionStorage.removeItem("cart");
  sessionStorage.removeItem(key);
}

// Ger en väg tillbaka till status för ett pågående betalningsförsök.
export function pendingCheckoutId(): string | undefined {
  const saved = sessionStorage.getItem(key);
  return saved ? (JSON.parse(saved) as Attempt).id : undefined;
}
