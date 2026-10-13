/**
 * Follow-up reminders for saved jobs, kept pure so they can be tested. Dates
 * are plain YYYY-MM-DD strings in the user's local time zone.
 */

const FOLLOW_UP_DAYS: Record<string, number> = { applied: 7, interviewing: 2 };

/** Today in local time, as YYYY-MM-DD. */
export function localDay(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return localDay(new Date(y, m - 1, d + days));
}

/**
 * The reminder to set when a job moves to a status: chase an application after a
 * week, send a thank-you two days after an interview. Null clears it (offer, rejected).
 */
export function followUpFor(status: string, now = new Date()): string | null {
  const days = FOLLOW_UP_DAYS[status];
  return days ? addDays(localDay(now), days) : null;
}

export const FOLLOW_UP_HINT: Record<string, string> = {
  applied: "Chase the application if you haven't heard back",
  interviewing: "Send a thank-you or ask about next steps",
  interested: "Apply before the role closes",
};

export type Due = "overdue" | "today" | "soon" | "later";

export function dueState(day: string | undefined, today = localDay()): Due | null {
  if (!day) return null;
  if (day < today) return "overdue";
  if (day === today) return "today";
  return day <= addDays(today, 2) ? "soon" : "later";
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

/** A one-day calendar event (works in Google, Apple and Outlook calendars). */
export function toIcs(event: { uid: string; day: string; title: string; description?: string; url?: string }, now = new Date()): string {
  const date = event.day.replace(/-/g, "");
  const end = addDays(event.day, 1).replace(/-/g, "");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Horus//Job reminders//EN",
    "BEGIN:VEVENT",
    `UID:${event.uid}@horus.to`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${icsText(event.description)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(event.title)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
