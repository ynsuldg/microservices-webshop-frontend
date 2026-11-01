import { Form, Link, redirect, useNavigation } from "react-router";
import { getSession } from "~/sessions.server";
import { registerAccount } from "~/service/registrationService";
import type { Route } from "./+types/registerPage";

// Skickar redan inloggade användare till välkomstsidan.
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.get("accessToken")) throw redirect("/welcome");
  return null;
}

// Anger registreringssidans titel.
export function meta() {
  return [{ title: "Create account - Blackmarqet" }];
}

// Validerar formuläret på servern och registrerar kontot genom gatewayn.
export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) return { error: "Enter a valid email address.", username };
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
    return { error: "Password must have at least 8 characters and at most 72 UTF-8 bytes.", username };
  }
  if (password !== confirmPassword) return { error: "Passwords do not match.", username };
  const error = await registerAccount({ username, password });
  if (error) return { error, username };
  return redirect("/login?registered=1");
}

// Visar registrering med samma layout och knappar som login.
export default function RegisterPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const input = "mt-2 w-full rounded-md border border-slate-300 bg-transparent px-4 py-2 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300";
  const button = "w-full rounded-sm border-2 border-slate-400 px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";
  return (
    <main className="flex items-center justify-center">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs tracking-[0.25em] text-slate-500 dark:text-slate-400">BLACKMARQET</p>
        <h1 className="mt-3 text-center text-2xl font-medium">Create account</h1>
        {actionData?.error && <p role="alert" className="mt-6 text-center text-sm text-red-600 dark:text-red-300">{actionData.error}</p>}
        <Form method="post" className="mt-10 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm">Email</label>
            <input id="username" name="username" type="email" autoComplete="username" required defaultValue={actionData?.username} className={input} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className={input} aria-describedby="password-help" />
            <p id="password-help" className="mt-2 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className={input} />
          </div>
          <button type="submit" disabled={busy} className={button}>{busy ? "Creating account..." : "Create account"}</button>
        </Form>
        <Link to="/login" className={"mt-4 block " + button}>Back to login</Link>
      </div>
    </main>
  );
}
