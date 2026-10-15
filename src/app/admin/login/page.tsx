import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

async function login(formData: FormData) {
  "use server";
  const token = await adminToken();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  // Only redirect within /admin so the login can't be used as an open redirect
  const target = next.startsWith("/admin/") ? next : "/admin/analytics";

  if (!token || password !== process.env.ADMIN_PASSWORD) redirect(`/admin/login?error=1&next=${encodeURIComponent(target)}`);

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(target);
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const configured = Boolean(process.env.ADMIN_PASSWORD);

  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-2xl text-foreground">Admin</h1>
      {configured ? (
        <form action={login} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="Password"
            aria-label="Password"
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
          />
          {error && <p className="text-sm text-destructive">Wrong password.</p>}
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Set ADMIN_PASSWORD in the environment to enable the admin pages.</p>
      )}
    </main>
  );
}
