import { useEffect, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import {
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useFetcher,
  redirectDocument,
} from "react-router";
import ProductCard from "~/components/ProductCard";
import { getProducts } from "~/service/productService";
import type { Route } from "./+types/productsPage";
import { tokenContext } from "~/context/context";
import type { CartItemType } from "~/types/CartItemType";
import type { Product } from "~/types/Product";
import { createCheckout } from "~/service/paymentService";
import { checkoutAttempt, pendingCheckoutId } from "~/utils/checkout";
import Cart from "~/components/cart/Cart";
import { categories } from "~/types/Category";
import { SearchInput } from "~/components/Search/SearchInput";

export async function loader({ context }: Route.LoaderArgs) {
  const accessToken = context.get(tokenContext);
  return { products: await getProducts(accessToken) };
}

// Öppnar Stripe via gatewayn och behåller varukorgen tills backend bekräftat betalningen.
export async function action({ request, context }: Route.ActionArgs) {
  const accessToken = context.get(tokenContext);
  const formData = await request.formData();
  try {
    const orderRequest = JSON.parse(formData.get("order") as string);
    const id = String(formData.get("checkoutId") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid checkout attempt.");
    const checkout = await createCheckout(id, accessToken, orderRequest);
    return redirectDocument(checkout.url);
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unable to start payment. Please try again.",
    };
  }
}

export function HydrateFallback() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <p>Loading products...</p>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "Unable to load products.";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <p className="text-red-700 dark:text-red-300">{message}</p>
    </main>
  );
}

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState("");
  const [pendingId, setPendingId] = useState<string>();

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;

    const query = searchTerm.trim().toLowerCase();

    const searchMatch = query === "" || product.name.toLowerCase().includes(query) || (product.description ?? "").toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  useEffect(() => {
    try {
      const savedCart = sessionStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      setPendingId(pendingCheckoutId());
    } catch { }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    sessionStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems, cartLoaded]);

  function addToCart(product: Product) {
    const index = cartItems.findIndex((item) => item.id === product.id);

    if (index === -1) {
      const newItem = { ...product, quantity: 1 };
      setCartItems([...cartItems, newItem]);
      return;
    }

    const currentItem = cartItems[index];

    if (currentItem.quantity >= currentItem.stock) {
      alert("There are no more products in storage");
      return;
    }

    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...currentItem,
      quantity: currentItem.quantity + 1,
    };

    setCartItems(updatedItems);

    alert(`${product.name} has been added to cart.`);
  }

  function increaseQuantity(productId: number) {
    const index = cartItems.findIndex((item) => item.id === productId);

    const currentItem = cartItems[index];

    if (currentItem.quantity >= currentItem.stock) {
      alert("There are no more products in storage");
      return;
    }

    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...currentItem,
      quantity: currentItem.quantity + 1,
    };

    setCartItems(updatedItems);
  }

  function decreaseQuantity(productId: number) {
    const index = cartItems.findIndex((item) => item.id === productId);

    const currentItem = cartItems[index];
    const updatedItems = [...cartItems];

    if (currentItem.quantity === 1) {
      updatedItems.splice(index, 1);
      setCartItems(updatedItems);
      return;
    }

    updatedItems[index] = {
      ...currentItem,
      quantity: currentItem.quantity - 1,
    };

    setCartItems(updatedItems);
  }

  // Återanvänder försöks-id även efter ett tappat svar eller en omladdning.
  function handleCheckout() {
    if (fetcher.state !== "idle") return;
    if (cartItems.length === 0) {
      alert("Cart is empty");
      return;
    }

    const orderRequest = {
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const attempt = checkoutAttempt(cartItems);
      setPendingId(attempt.id);
      setCheckoutError("");
      fetcher.submit(
        { order: JSON.stringify(orderRequest), checkoutId: attempt.id },
        { method: "post" },
      );
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to save checkout attempt.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Products</h1>
      {pendingId && <a className="mt-4 block underline" href={`/checkout/return?reservation_id=${pendingId}`}>View earlier payment attempt</a>}
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <label htmlFor="category-filter" className="block text-sm text-slate-700 dark:text-slate-300">Category</label>
          <div className="relative mt-2">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-10 py-2 pl-4 pr-10 appearance-none rounded-md border border-slate-300 text-slate-900 bg-white dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="All">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <IoChevronDown aria-hidden="true" className="pointer-events-none size-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-100" />
          </div>
        </div>
        <SearchInput searchTerm={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button
          type="button"
          onClick={() => setShowCart(!showCart)}
          className="cursor-pointer h-10 px-4 py-2 shrink-0 rounded-md border border-slate-300 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {showCart ? "Hide cart" : "Show cart"}
        </button>
      </div>

      {products.length === 0 && (
        <p className="mt-6 text-slate-600 dark:text-slate-300">
          No products are available.
        </p>
      )}

      {products.length > 0 && filteredProducts.length === 0 && (
        <p className="mt-6 text-slate-600 dark:text-slate-300">
          {searchTerm.trim()
            ? `No products match "${searchTerm}".`
            : "No products found in this category."}
        </p>
      )}

      {filteredProducts.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
      )}

      {showCart && (
        <Cart
          items={cartItems}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onCheckout={handleCheckout}
          onClose={() => setShowCart(false)}
          checkoutPending={fetcher.state !== "idle"}
          checkoutError={checkoutError || fetcher.data?.error}
        />
      )}
    </main>
  );
}
