/**
 * The last valid JSON object in a model reply. Reasoning models sometimes
 * think aloud with example braces before giving the real answer, so the last
 * parseable object is the one to trust.
 */
export function lastJsonObject(text: string): Record<string, unknown> | null {
  const starts: number[] = [];
  let quoted = false;
  let escaped = false;
  let result: Record<string, unknown> | null = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"' && starts.length > 0) quoted = true;
    if (char === "{") starts.push(i);
    if (char !== "}" || starts.length === 0) continue;
    const start = starts.pop()!;
    try {
      const v = JSON.parse(text.slice(start, i + 1));
      if (v && typeof v === "object" && !Array.isArray(v)) result = v;
    } catch {
      // Not JSON; keep looking for the final answer
    }
  }
  return result;
}
