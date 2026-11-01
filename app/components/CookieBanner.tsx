interface CookieBannerProps {
    onDismiss: () => void
}

export const CookieBanner = ({ onDismiss }: CookieBannerProps) => {
    return (
        <div className="px-4 py-3 fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white dark:border-[#9c9177]/20 dark:bg-slate-900">
            <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                    Demo Webshop använder en nödvändig cookie (HttpOnly) för att hålla
                    dig inloggad och ge säker åtkomst till ditt konto. Cookien krävs
                    för att tjänsten ska fungera och är inget du behöver godkänna.
                </p>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="cursor-pointer px-4 py-2 shrink-0 rounded-md border border-slate-300 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-500 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                    I understand
                </button>
            </div>
        </div>
    );
}