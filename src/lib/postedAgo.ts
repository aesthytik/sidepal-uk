/** "today", "3 days ago", "2 weeks ago", or a date for older roles. */
export function postedAgo(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 864e5);
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
