import { useEffect } from "react";
import { Link, redirect, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/checkoutReturnPage";
import { tokenContext } from "~/context/context";
import { getCheckoutStatus, PaymentRequestError } from "~/service/paymentService";
import { discardMissingCheckout, finishCheckout } from "~/utils/checkout";
export { ErrorBoundary } from "./productsPage";

// Hämtar status från backend; returadressens resultat räknas aldrig som betalningsbevis.
export async function loader({ request, context }: Route.LoaderArgs) {
  const id = new URL(request.url).searchParams.get("reservation_id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Response("Invalid payment reference", { status: 400 });
  try {
    const payment = await getCheckoutStatus(id, context.get(tokenContext));
    return { id, payment, missing: false };
  } catch (error) {
    if (error instanceof PaymentRequestError && error.status === 401) throw redirect("/login");
    return { id, payment: null, missing: error instanceof PaymentRequestError && error.status === 404 };
  }
}

// Visar serverbekräftad status och låter kunden uppdatera medan webhooken behandlas.
export default function CheckoutReturnPage() {
  const { id, payment, missing } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  useEffect(() => {
    try { if (payment) finishCheckout(id, payment.status); } catch { /* Behåller varukorgen om lokalt innehåll inte kan läsas. */ }
  }, [id, payment?.status]);
  const terminal = missing || payment?.status === "PAID" || payment?.status === "CANCELLED";
  return <main className="mx-auto w-full max-w-6xl px-4 py-12">
    <h1 className="text-3xl font-bold">Payment status</h1>
    {payment && <p className="mt-4">Order #{payment.orderId}</p>}
    <p className="mt-2" role="status">{missing ? "Order could not be found. Your cart has been kept."
      : !payment ? "Unable to retrieve payment status. Please try again. Your cart and payment reference have been kept."
      : payment.status === "PAID" ? "Payment confirmed. Thank you for your order."
      : payment.status === "CANCELLED" ? "The payment session has expired. Your cart has been kept."
      : "Payment has not been confirmed yet. If you left Checkout, your cart is kept and stock remains reserved until the session expires."}</p>
    {!terminal && <button type="button"
      className="mt-4 cursor-pointer rounded-md border border-slate-500 px-4 py-2 transition-colors hover:bg-slate-800 hover:text-slate-100 active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-wait disabled:opacity-60"
      disabled={revalidator.state !== "idle"} aria-busy={revalidator.state !== "idle"}
      onClick={() => revalidator.revalidate()}>{revalidator.state !== "idle" ? "Refreshing…" : "Refresh status"}</button>}
    <Link className="mt-6 block underline" to="/products" onClick={() => {
      // Rensar endast matchande referens efter ett uttryckligt 404-svar och kundens val att gå tillbaka.
      if (missing) { try { discardMissingCheckout(id); } catch { /* Behåller lokalt innehåll om lagringen inte kan läsas. */ } }
    }}>{missing ? "Clear missing payment reference and return to products" : "Back to products"}</Link>
  </main>;
}
