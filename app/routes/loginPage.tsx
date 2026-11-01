import { useState } from "react";
import { Form, Link, useNavigation, useSearchParams } from "react-router";
import { login } from "~/service/authService";

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
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	return (
		<main className="flex items-center justify-center overflow-hidden">
			<div className="w-full max-w-sm">
				<p className="text-center text-xs tracking-[0.25em] text-slate-500 dark:text-slate-400">BLACKMARQET</p>
				<h1 className="mt-3 text-center text-2xl font-medium">State your business</h1>

				{searchParams.get("registered") === "1" && (
					<p role="status" className="mt-6 text-center text-sm text-green-600 dark:text-green-300">Account created. You can now log in.</p>
				)}

				{searchParams.get("deleted") === "1" && (
					<p role="status" className="mt-6 text-center text-sm text-green-600 dark:text-green-300">Your account has been deleted.</p>
				)}

				{error ? (
					<div className="w-fit mx-auto mt-6 px-4 py-2 rounded-md border-2 border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-300/30">
						<p className="text-center text-xs font-medium text-red-700 dark:text-red-400">ACCESS DENIED</p>
						<p className="mt-1 text-center text-sm text-red-600 dark:text-red-200">{error}</p>
					</div>
				) : null}

				<Form method="POST" className="mt-10 space-y-6">
					<div>
						<label htmlFor="username" className="block text-sm text-slate-700 dark:text-slate-300">Username</label>
						<input
							id="username" type="email" name="username" value={username} onChange={(e) => setUsername(e.target.value)}
							className="w-full mt-2 px-4 py-2 rounded-md border border-slate-300 text-slate-900 bg-transparent outline-none focus:border-slate-500 dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm text-slate-700 dark:text-slate-300">Password</label>
						<input
							id="password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)}
							className="w-full mt-2 px-4 py-2 
							rounded-md border border-slate-300 text-slate-900 bg-transparent outline-none 
							focus:border-slate-500 
							dark:border-slate-500 dark:text-slate-100 dark:focus:border-slate-300"
						/>
					</div>

					<button
						type="submit" disabled={isSubmitting}
						className="cursor-pointer w-full mt-4 px-6 py-3 
						rounded-sm border-2 border-slate-400 text-sm text-slate-700 font-medium 
						transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 
						dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
					>
						{isSubmitting ? "Logging in..." : "Login"}
					</button>
				</Form>
				<Link to="/register" className="mt-4 block w-full rounded-sm border-2 border-slate-400 px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">Create account</Link>
			</div>
		</main>
	);
}