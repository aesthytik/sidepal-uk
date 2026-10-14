/** Cookie that unlocks /admin. Its value is a hash of ADMIN_PASSWORD, so the password itself never sits in the browser. */
export const ADMIN_COOKIE = "horus-admin";

/** Expected cookie value, or null when ADMIN_PASSWORD isn't set (admin stays locked). Uses Web Crypto so middleware can call it too. */
export async function adminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`horus-admin:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
