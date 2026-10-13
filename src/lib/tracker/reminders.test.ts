import { describe, expect, it } from "vitest";
import { addDays, dueState, followUpFor, localDay, toIcs } from "./reminders";

const now = new Date(2026, 9, 13, 15, 0); // 13 Oct 2026, local time

describe("reminders", () => {
  it("formats local days and adds across month ends", () => {
    expect(localDay(now)).toBe("2026-10-13");
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("sets a follow-up a week after applying and two days after an interview", () => {
    expect(followUpFor("applied", now)).toBe("2026-10-20");
    expect(followUpFor("interviewing", now)).toBe("2026-10-15");
    expect(followUpFor("offer", now)).toBeNull();
    expect(followUpFor("rejected", now)).toBeNull();
  });

  it("says how due a reminder is", () => {
    const today = "2026-10-13";
    expect(dueState(undefined, today)).toBeNull();
    expect(dueState("2026-10-12", today)).toBe("overdue");
    expect(dueState("2026-10-13", today)).toBe("today");
    expect(dueState("2026-10-15", today)).toBe("soon");
    expect(dueState("2026-10-16", today)).toBe("later");
  });

  it("writes an all-day calendar event with escaped text", () => {
    const ics = toIcs({ uid: "abc", day: "2026-10-20", title: "Chase Acme, Ltd", description: "Line 1\nLine 2", url: "https://jobs/1" }, new Date("2026-10-13T12:00:00.000Z"));
    expect(ics).toContain("DTSTART;VALUE=DATE:20261020\r\nDTEND;VALUE=DATE:20261021");
    expect(ics).toContain("SUMMARY:Chase Acme\\, Ltd");
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2");
    expect(ics).toContain("DTSTAMP:20261013T120000Z");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });
});
