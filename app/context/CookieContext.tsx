import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CookieBanner } from "~/components/CookieBanner";

type CookieContextValue = {
    open: () => void
}

const CookieContext = createContext<CookieContextValue | null>(null);

const STORAGE_KEY = "demo-webshop-cookie-dismissed";

export function CookieProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
        setVisible(!dismissed);
        setReady(true);
    }, []);

    const dismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setVisible(false);
    }, []);

    const open = useCallback(() => {
        setVisible(true);
    }, []);

    return (
        <CookieContext.Provider value={{ open }}>
            {children}
            {ready && visible && <CookieBanner onDismiss={dismiss} />}
        </CookieContext.Provider>
    );
}

export function useCookieBanner() {
    const ctx = useContext(CookieContext);
    if (!ctx) {
        throw new Error("useCookieNotice must be used within CookieNoticeProvider");
    }
    return ctx;
}