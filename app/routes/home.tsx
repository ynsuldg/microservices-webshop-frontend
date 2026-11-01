import { Link, redirect } from "react-router";
import type { Route } from "./+types/home";
import { getSession } from "~/sessions.server";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Demo Webshop" },
    { name: "description", content: "Welcome to Demo Webshop!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken");

  if (accessToken) {
    throw redirect("/welcome");
  }
}

export default function Home() {
  return (
    <main className="px-6 flex items-center justify-center overflow-hidden">
      <div className="text-center">
        <p className="text-xs tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Demo Webshop
        </p>
        <h1 className="mt-4 text-3xl font-medium">
          Not everything is for sale.
          <br />
          Here, it is.
        </h1>
        <p className="max-w-sm mx-auto mt-4 text-slate-600 dark:text-slate-300">
          No questions asked, no names taken. Browse what's available, and take what you came for.
        </p>
        <Link
          to="/products"
          className="mt-10 px-6 py-3 inline-flex items-center rounded-sm border-2 border-slate-400 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          Browse the market
        </Link>
      </div>
    </main>
  );
};