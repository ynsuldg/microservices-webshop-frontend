import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Product } from "~/types/Product";
import ProductCard from "~/components/ProductCard";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";

const product: Product = {
    id: 1,
    name: "Computer",
    description: "Very good computer",
    price: 499,
    stock: 10,
    category: "ELECTRONICS",
    imageUrl: "https://example.com/image.jpg"
};

afterEach(() => {
    cleanup();
});

describe("ProductCard", () => {
    it("visar ProductCard", () => {
        const Stub = createRoutesStub([
            {
                path: "/",
                Component: () => <ProductCard product={product} onAdd={vi.fn()} />,
            },
        ]);
        render(<Stub initialEntries={["/"]} />);

        expect(screen.getByText("Computer")).toBeInTheDocument();
        expect(screen.getByText("Very good computer")).toBeInTheDocument();
        expect(screen.getByText("$499.00")).toBeInTheDocument();
        expect(screen.getByText("10 in stock")).toBeInTheDocument();
        expect(screen.getByText("ELECTRONICS")).toBeInTheDocument();
    });

    it("anropar onAdd", async () => {
        const onAdd = vi.fn(() => true);
        const user = userEvent.setup();

        const Stub = createRoutesStub([
            {
                path: "/",
                Component: () => <ProductCard product={product} onAdd={onAdd} />,
            },
        ]);
        render(<Stub initialEntries={["/"]} />);

        await user.click(screen.getByRole("button", { name: /add to cart/i }));

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(product);
        expect(screen.getByRole("button", { name: /added to cart/i })).toBeInTheDocument();
    });

    it("återställer knapptexten efter bekräftelsen", async () => {
        const user = userEvent.setup();
        const Stub = createRoutesStub([{ path: "/", Component: () => <ProductCard product={product} onAdd={() => true} /> }]);
        render(<Stub initialEntries={["/"]} />);
        await user.click(screen.getByRole("button", { name: /add to cart/i }));
        expect(screen.getByRole("button", { name: /added to cart/i })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /^add to cart$/i }, { timeout: 2500 })).toBeInTheDocument();
    });

    it("visar ingen lyckad bekräftelse om varan inte kunde läggas till", async () => {
        const user = userEvent.setup();
        const Stub = createRoutesStub([{ path: "/", Component: () => <ProductCard product={product} onAdd={() => false} /> }]);
        render(<Stub initialEntries={["/"]} />);
        await user.click(screen.getByRole("button", { name: /add to cart/i }));
        expect(screen.getByRole("button", { name: /^add to cart$/i })).toBeInTheDocument();
        expect(screen.queryByText(/added to cart/i)).not.toBeInTheDocument();
    });
});