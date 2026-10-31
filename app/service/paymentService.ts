import type { OrderRequestDTO } from "~/types/Order";

export type CheckoutStatus = { orderId: number; status: string };
const gateway = import.meta.env.VITE_GATEWAY_URL;

// Anropar gatewayn med kundens befintliga sessionstoken utan interna serverhemligheter.
async function paymentRequest(id: string, accessToken: string, order?: OrderRequestDTO) {
  if (!gateway) throw new Error("Payment service is not configured.");
  const response = await fetch(`${gateway.replace(/\/$/, "")}/checkouts/${encodeURIComponent(id)}`, {
    method: order ? "POST" : "GET",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    ...(order ? { body: JSON.stringify(order) } : {}),
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Your session has expired. Please log in again."
      : "Unable to complete the payment request. Please try again.");
  }
  return response.json();
}

// Skapar eller återanvänder checkout för samma betalningsförsök.
export async function createCheckout(id: string, token: string, order: OrderRequestDTO): Promise<{ url: string }> {
  const result = await paymentRequest(id, token, order);
  const url = new URL(result.url);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") {
    throw new Error("Invalid payment address.");
  }
  return { url: url.href };
}

// Hämtar betalningsstatus som backend har bekräftat.
export async function getCheckoutStatus(id: string, token: string): Promise<CheckoutStatus> {
  return paymentRequest(id, token);
}
