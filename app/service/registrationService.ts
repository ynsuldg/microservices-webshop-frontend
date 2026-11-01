import type { LoginRequest } from "~/types/LoginRequest";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

// Registrerar kontot via gatewayn och visar begripliga fel utan serverdetaljer.
export async function registerAccount(request: LoginRequest): Promise<string | null> {
  try {
    const response = await fetch(GATEWAY_URL.replace(/\/$/, "") + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (response.ok) return null;
    if (response.status === 409) return "An account with this email already exists.";
    if (response.status === 400) return "Enter a valid email and a password of 8–72 characters (maximum 72 UTF-8 bytes).";
    return "Unable to create your account. Please try again.";
  } catch {
    return "Unable to reach the service. Please try again.";
  }
}
