/**
 * The last valid flat JSON object in a model reply. Reasoning models sometimes
 * think aloud with example braces before giving the real answer, so the last
 * parseable object is the one to trust.
 */
export function lastJsonObject(text: string): Record<string, unknown> | null {
  const candidates = text.match(/\{[^{}]*\}/g) ?? [];
  for (const c of candidates.reverse()) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === "object" && !Array.isArray(v)) return v;
    } catch {
      // Not JSON; try the previous candidate
    }
  }
  return null;
}
