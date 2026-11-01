import { useCookieBanner } from "~/context/CookieContext"

export const Footer = () => {
    const { open } = useCookieBanner();

    return <footer className="border-t border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <div className="w-full max-w-6xl mx-auto px-4 py-5 flex items-start justify-between gap-4">
            <div>
                <p>© 2026 Demo Webshop</p>
                <p className="mt-1 text-sm">All rights reserved</p>
            </div>
            <div className="shrink-0 text-right">
                <button
                    type="button"
                    onClick={open}
                    className="cursor-pointer text-sm hover:underline"
                >
                    Om cookies
                </button>
            </div>
        </div>
    </footer >
}
