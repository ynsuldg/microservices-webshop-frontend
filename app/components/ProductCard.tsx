import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Product } from "~/types/Product";

type ProductProps = {
  product: Product;
  onAdd: (product: Product) => boolean;
};

const ProductCard = ({ product, onAdd }: ProductProps) => {
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tar bort återkopplingens timer om kortet filtreras bort eller sidan stängs.
  useEffect(() => () => {
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
  }, []);

  // Bekräftar endast ett lyckat tillägg och förlänger återkopplingen vid upprepade klick.
  function handleAdd() {
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    if (!onAdd(product)) {
      setAdded(false);
      return;
    }
    setAdded(true);
    resetTimer.current = setTimeout(() => setAdded(false), 1000);
  }

  return (
    <article className="flex h-full flex-col p-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Link to={`/products/${product.id}`} className="flex flex-1 flex-col">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-48 w-full rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center rounded text-slate-500 bg-slate-100 dark:bg-slate-800">
            No image
          </div>
        )}

        <div className="mt-4 mb-4 flex flex-1 flex-col">
          <span className="w-fit px-3 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
            {product.category}
          </span>

          <h2 className="mt-3 text-xl font-semibold">
            {product.name}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {product.description}
          </p>

          <div className="mt-auto flex items-baseline justify-between pt-4">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {product.price.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAdd}
        className={"cursor-pointer w-full py-2 rounded-md border text-sm font-medium transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 motion-reduce:transform-none motion-reduce:transition-none " + (added
          ? "border-emerald-600 bg-emerald-100 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700")}
      >
        <span role="status" aria-live="polite">{added ? "Added to cart ✓" : "Add to cart"}</span>
      </button>
    </article>
  );
};

export default ProductCard;