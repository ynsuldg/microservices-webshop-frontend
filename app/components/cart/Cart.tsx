import { IoClose } from "react-icons/io5";
import type { CartItemType } from "~/types/CartItemType";
import { CartItem } from "./CartItem";

type CartProps = {
    items: CartItemType[];
    onIncrease: (productId: number) => void;
    onDecrease: (productId: number) => void;
    onClose: () => void;
    onCheckout: () => void;
    checkoutPending?: boolean;
    checkoutError?: string;
};

// Visar varukorgen och håller betalningsfel synliga utan att ta bort produkterna.
const Cart = ({ items, onIncrease, onDecrease, onClose, onCheckout, checkoutPending, checkoutError }: CartProps) => {
    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    return <>
        <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
        />
        <aside className="w-full max-w-sm fixed inset-y-0 right-0 z-50 flex flex-col bg-white dark:bg-slate-900 select-none">
            <header className="px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-[#9c9177]/20">
                <div>
                    <p className="text-[10px] tracking-[0.25em] text-slate-500 dark:text-slate-400">
                        BLACKMARQET
                    </p>
                    <h2 className="mt-1 text-xl font-medium">
                        The Manifest
                    </h2>
                </div>
                <IoClose className="size-8 p-1 rounded-md cursor-pointer text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-300/10" onClick={onClose} />
            </header>

            <div className="px-6 py-4 flex-1 overflow-y-auto">
                {
                    items.length === 0 ? (
                        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            Nothing's been claimed yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-200 dark:divide-[#9c9177]/15">
                            {
                                items.map((item) => (
                                    <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} />
                                ))
                            }
                        </ul>
                    )
                }
            </div>

            <footer className="px-6 py-5 flex flex-col items-baseline justify-between gap-4 border-t border-slate-200 dark:border-[#9c9177]/20">
                <p className="w-full flex items-baseline justify-between">
                    <span className="text-sm">Total:</span>
                    <strong className="text-xl">
                        $ {totalPrice.toFixed(2)}
                    </strong>
                </p>
                <div className="w-full">
                    {checkoutError && <p role="alert" className="mb-3 text-red-600 dark:text-red-300">{checkoutError}</p>}
                    <button
                        type="button"
                        onClick={onCheckout}
                        disabled={checkoutPending || items.length === 0}
                        className="cursor-pointer w-full px-4 py-3 rounded-md border border-slate-300 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-500 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        {checkoutPending ? "Opening payment..." : "Pay with Stripe"}
                    </button>
                </div>
            </footer>
        </aside >
    </>
}

export default Cart;
