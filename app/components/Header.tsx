import { useRouteLoaderData } from "react-router";
import { AuthBtn } from "./AuthBtn";
import { NavItem } from "./Nav/NavItem";
import type { loader as rootLoader } from "~/root";

export const Header = () => {
    const rootData = useRouteLoaderData<typeof rootLoader>("root");
    const isLoggedIn = rootData?.isLoggedIn ?? false;

    return <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
                <h3 className="text-3xl font-bold">Demo Webshop</h3>
            </div>
            <nav className="flex items-center gap-4">
                <ul className="flex">
                    <NavItem to="/" text="HOME" />
                    <NavItem to="/products" text="PRODUCTS" />
                </ul>
                <AuthBtn isLoggedIn={isLoggedIn} />
            </nav>
        </div>
    </header>;
}
