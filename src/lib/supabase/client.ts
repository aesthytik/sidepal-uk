import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let reader: SupabaseClient | null = null;
let admin: SupabaseClient | null = null;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Read-only client using the publishable key; RLS limits it to public data. */
export function supabaseRead(): SupabaseClient {
  reader ??= createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), options);
  return reader;
}

/** Server-only client with the service-role key. Bypasses RLS: never import this into client code. */
export function supabaseAdmin(): SupabaseClient {
  admin ??= createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), options);
  return admin;
}

const PAGE = 1000;

/** Reads every row of a query; Supabase returns at most 1000 rows per request. */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}
