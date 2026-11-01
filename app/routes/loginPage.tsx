import { useEffect, useState } from "react";
import { Form, Link, useNavigation, useSearchParams } from "react-router";
import { login } from "~/service/authService";
import { resetPassword } from "~/service/passwordResetService";

import { redirect } from "react-router";
import { getSession, commitSession } from "~/sessions.server";
import type { Route } from "./+types/loginPage";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	const accessToken = session.get("accessToken");

	if (accessToken) {
		throw redirect("/welcome");
	}

	return null;
}

export function meta() {
	return [
		{ title: "Login - Blackmarqet" }
	];
}

export async function action({ request }: Route.ActionArgs) {
	const session = await getSession(request.headers.get("Cookie"));

	const formData = await request.formData();
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	if (formData.get("intent") === "password-reset") {
		const email = typeof username === "string" ? username.trim() : "";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
		if (typeof password !== "string" || password.length < 8 || new TextEncoder().encode(password).length > 72) {
			return { error: "Password must have at least 8 characters and at most 72 UTF-8 bytes." };
		}
		if (password !== formData.get("confirmPassword")) return { error: "Passwords do not match." };
		const error = await resetPassword(email, password);
		if (error) return { error };
		return redirect("/login?reset=1");
	}

	const tokenResponse = await login({ username, password });

	if (!tokenResponse) {
		return { error: "Wrong username or password." };
	}

	session.set("accessToken", tokenResponse.accessToken);
	session.set("expiresIn", tokenResponse.expiresIn);
	session.set("subject", tokenResponse.subject);
	session.set("roles", tokenResponse.roles);

	return redirect("/welcome", {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
	const error = actionData?.error;
	const [searchParams] = useSearchParams();
	const resetting = searchParams.get("mode") === "reset";
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Rensar lösenordsfälten när användaren växlar mellan login och återställning.
	useEffect(() => { setPassword(""); setConfirmPassword(""); }, [resetting]);

	return (
		<main className="flex items-center justify-center overflow-hidden">
			<div className="w-full max-w-sm">
				<p className="text-center text-xs tracking-[0.25em] text-slate-500 dark:text-slate-400">BLACKMARQET</p>
				<h1 className="mt-3 text-center text-2xl font-medium">{resetting ? "Reset password" : "State your business"}</h1>

				{searchParams.get("registered") === "1" && (
					<p role="status" className="mt-6 text-center text-sm text-green-600 dark:text-green-300">Account created. You can now log in.</p>
				)}

				{searchParams.get("deleted") === "1" && (
					<p role="status" className="mt-6 text-center text-sm text-green-600 dark:text-green-300">Your account has been deleted.</p>
				)}

				{searchParams.get("reset") === "1" && (
					<p role="status" className="mt-6 text-center text-sm text-green-600 dark:text-green-300">Password reset. You can now log in with your new password.</p>
				)}

				{error ? (
					<div className="w-fit mx-auto mt-6 px-4 py-2 rounded-md border-2 border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-300/30">
						<p className="text-center text-xs font-medium text-red-700 dark:text-red-400">{resetting ? "RESET FAILED" : "ACCESS DENIED"}</p>
						<p className="mt-1 text-center text-sm text-red-600 dark:text-red-200">{error}</p>
					</div>
				) : null}

				<Form method="POST" className="mt-10 space-y-6">
					<input type="hidden" name="intent" value={resetting ? "password-reset" : "login"} />
					<div>
						<label htmlFor="username" className="block text-sm text-slate-700 dark:text-slate-300">Username</label>
						<input
							id="username" type="email" name="username" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)}
							className="w-full mt-2 px-4 py-2 rounded-md border border-slate-300 text-slate-900 bg-transparent outline-none focus:border-slate-500 dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm text-slate-700 dark:text-slate-300">{resetting ? "New password" : "Password"}</label>
						<input
							id="password" type="password" name="password" required minLength={resetting ? 8 : undefined} maxLength={resetting ? 72 : undefined} autoComplete={resetting ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)}
							className="w-full mt-2 px-4 py-2 
							rounded-md border border-slate-300 text-slate-900 bg-transparent outline-none 
							focus:border-slate-500 
							dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300"
						/>
					</div>

					{resetting && (
						<div>
							<label htmlFor="confirmPassword" className="block text-sm text-slate-700 dark:text-slate-300">Confirm new password</label>
							<input id="confirmPassword" type="password" name="confirmPassword" required autoComplete="new-password" minLength={8} maxLength={72}
								value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
								className="mt-2 w-full rounded-md border border-slate-300 bg-transparent px-4 py-2 text-slate-900 outline-none focus:border-slate-500 dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300" />
							<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
						</div>
					)}

					<button
						type="submit" disabled={isSubmitting}
						className="cursor-pointer w-full mt-4 px-6 py-3 
						rounded-sm border-2 border-slate-400 text-sm text-slate-700 font-medium 
						transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 
						dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
					>
						{resetting ? (isSubmitting ? "Resetting password..." : "Reset password") : (isSubmitting ? "Logging in..." : "Login")}
					</button>
				</Form>
				{resetting ? (
					<Link to="/login" className="mt-4 block text-center text-sm underline">Back to login</Link>
				) : (
					<>
						<Link to="/login?mode=reset" className="mt-4 block text-center text-sm underline">Forgot password?</Link>
				<Link to="/register" className="mt-4 block w-full rounded-sm border-2 border-slate-400 px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">Create account</Link>
					</>
				)}
			</div>
		</main>
	);
}