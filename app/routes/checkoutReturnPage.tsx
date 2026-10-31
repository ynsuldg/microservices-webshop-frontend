import { useEffect } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/checkoutReturnPage";
import { tokenContext } from "~/context/context";
import { getCheckoutStatus } from "~/service/paymentService";
import { finishCheckout } from "~/utils/checkout";
export { ErrorBoundary } from "./productsPage";

// Hämtar status från backend; returadressens resultat räknas aldrig som betalningsbevis.
export async function loader({ request, context }: Route.LoaderArgs) {
  const id = new URL(request.url).searchParams.get("reservation_id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Response("Invalid payment reference", { status: 400 });
  const payment = await getCheckoutStatus(id, context.get(tokenContext));
  return { id, payment };
}

// Visar serverbekräftad status och låter kunden uppdatera medan webhooken behandlas.
export default function CheckoutReturnPage() {
  const { id, payment } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  useEffect(() => {
    try { finishCheckout(id, payment.status); } catch { /* Behåller varukorgen om lokalt innehåll inte kan läsas. */ }
  }, [id, payment.status]);
  const terminal = payment.status === "PAID" || payment.status === "CANCELLED";
  return <main className="mx-auto w-full max-w-6xl px-4 py-12">
    <h1 className="text-3xl font-bold">Payment status</h1>
    <p className="mt-4">Order #{payment.orderId}</p>
    <p className="mt-2" role="status">{payment.status === "PAID" ? "Payment confirmed. Thank you for your order."
      : payment.status === "CANCELLED" ? "The payment session has expired. Your cart has been kept."
      : "Payment has not been confirmed yet. If you left Checkout, your cart is kept and stock remains reserved until the session expires."}</p>
    {!terminal && <button type="button" className="mt-4 rounded-md border px-4 py-2" disabled={revalidator.state !== "idle"}
      onClick={() => revalidator.revalidate()}>Refresh status</button>}
    <Link className="mt-6 block underline" to="/products">Back to products</Link>
  </main>;
}
