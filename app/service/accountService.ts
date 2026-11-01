const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

// Raderar endast kontot som JWT-tokenen identifierar och lämnar sessionen kvar vid fel.
export async function deleteAccount(token: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(GATEWAY_URL.replace(/\/$/, "") + "/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ password }),
    });
    if (response.status === 204) return null;
    if (response.status === 401) return "Incorrect password or expired session. Try again or log in again.";
    if (response.status === 400) return "Enter your current password.";
    return "Unable to delete your account. Please try again.";
  } catch {
    return "Unable to reach the service. Your account has not been confirmed as deleted. Please try again.";
  }
}
