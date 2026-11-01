const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

// Återställer ett demokontos lösenord utan mejl eller verifieringskod.
export async function resetPassword(username: string, newPassword: string): Promise<string | null> {
  try {
    const response = await fetch(GATEWAY_URL.replace(/\/$/, "") + "/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword }),
    });
    if (response.status === 204) return null;
    if (response.status === 404) return "No account was found with this email address.";
    if (response.status === 400) return "Enter a valid email and a password of at least 8 characters (maximum 72 UTF-8 bytes).";
    return "Unable to reset your password. Please try again.";
  } catch {
    return "Unable to reach the service. Please try again.";
  }
}
