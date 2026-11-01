import { Link } from "react-router";
import type { Product } from "~/types/Product";

type ProductProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

const ProductCard = ({ product, onAdd }: ProductProps) => {
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
        onClick={() => onAdd(product)}
        className="cursor-pointer w-full py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Add to cart
      </button>
    </article>
  );
};

export default ProductCard;