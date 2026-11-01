import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import { getSession, destroySession } from "~/sessions.server";
import { deleteAccount } from "~/service/accountService";
import type { Route } from "./+types/welcomePage";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    throw redirect("/login");
  }

  return {
    subject: session.get("subject"),
    roles: session.get("roles") ?? [],
  };
}

// Raderar det egna kontot och avslutar sessionen först efter bekräftat svar från auth-service.
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  if (!token) throw redirect("/login");
  const form = await request.formData();
  const password = form.get("password");
  if (form.get("intent") !== "delete-account" || typeof password !== "string" || !password) {
    return { error: "Enter your current password to confirm account deletion." };
  }
  const error = await deleteAccount(token, password);
  if (error) return { error };
  return redirect("/login?deleted=1", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export default function WelcomePage({ loaderData, actionData }: Route.ComponentProps) {
  const { subject, roles } = loaderData;
  const [confirming, setConfirming] = useState(false);
  const busy = useNavigation().state !== "idle";

  return (
    <main className="flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-lg border border-slate-300 p-8 shadow-sm dark:border-slate-700">
        <h1 className="text-3xl font-bold">Welcome, {subject}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          You are logged in to Demo Webshop.
        </p>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Your roles</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {roles.map((role) => (
              <li
                className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                key={role}
              >
                {role.replace("ROLE_", "")}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex justify-end">
          {confirming ? (
            <Form method="post" className="w-full max-w-sm space-y-3">
              <input type="hidden" name="intent" value="delete-account" />
              <p className="text-sm text-red-600 dark:text-red-300">Permanently delete your account? This cannot be undone.</p>
              <label htmlFor="delete-password" className="block text-sm">Current password</label>
              <input id="delete-password" name="password" type="password" autoComplete="current-password" required
                className="w-full rounded-md border border-slate-500 bg-transparent px-3 py-2" />
              {actionData?.error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{actionData.error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" disabled={busy} onClick={() => { setConfirming(false); }}
                  className="cursor-pointer rounded-md border border-slate-500 px-4 py-2 text-sm transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={busy}
                  className="cursor-pointer rounded-md border border-red-500 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-600 hover:text-white active:bg-red-700 disabled:opacity-50 dark:text-red-300">
                  {busy ? "Deleting account..." : "Delete account"}
                </button>
              </div>
            </Form>
          ) : (
            <button type="button" onClick={() => setConfirming(true)}
              className="cursor-pointer rounded-md border border-red-500 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-600 hover:text-white active:bg-red-700 dark:text-red-300">Delete account</button>
          )}
        </div>
      </section>
    </main>
  );
}
