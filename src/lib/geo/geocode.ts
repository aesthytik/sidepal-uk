import { ALIASES, PLACE_BY_ID, type Place } from "./places";
import { AMBIGUOUS, FOREIGN, FOREIGN_CODES, UK_MARKERS } from "./words";

/** Where a job sits: a UK place, somewhere unspecified in the UK ("remote"), or nowhere we can place. */
export type Located = Place | "remote" | null;

type Hit = { kind: "place"; id: string; alias: string } | { kind: "uk" } | { kind: "foreign" } | { kind: "remote" };

const MAX_WORDS = 4;
const REMOTE = new Set(["remote", "home based", "work from home", "anywhere in uk", "anywhere"]);

const cache = new Map<string, Located>();

/** Free-text job locations ("London, UK", "Hybrid - Newcastle upon Tyne", "Remote - UK") to a map place. */
export function placeOf(location: string): Located {
  const key = location ?? "";
  let out = cache.get(key);
  if (out === undefined) {
    out = resolve(key);
    cache.set(key, out);
  }
  return out;
}

function resolve(location: string): Located {
  // One entry per comma/slash/bracket-separated part, each with the hits found in it
  const parts = location
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[,/;|•()[\]:]| - | – | — | or | and | & /)
    .map((p) => p.replace(/[^a-z0-9]+/g, " ").trim())
    .filter(Boolean)
    .map(hitsIn);

  const all = parts.flat();
  const foreign = all.some((h) => h.kind === "foreign");

  for (let i = 0; i < parts.length; i++) {
    for (const hit of parts[i]) {
      if (hit.kind !== "place") continue;
      // "Perth, Western Australia" or "Durham, NC": a shared name next to something foreign
      if (AMBIGUOUS.has(hit.alias) && foreign && !confirmedUk(parts[i], parts[i + 1])) continue;
      return PLACE_BY_ID.get(hit.id) ?? null;
    }
  }

  const uk = all.some((h) => h.kind === "uk");
  const remote = all.some((h) => h.kind === "remote");
  return uk || (remote && !foreign) ? "remote" : null;
}

/**
 * A UK marker or UK county in the same part or the one after it, as in "Cambridge, UK" or
 * "Kingston, Greater London". Another city doesn't count: "Montreal, Jersey, London" is a list.
 */
function confirmedUk(part: Hit[], next: Hit[] | undefined): boolean {
  const isUk = (h: Hit) => h.kind === "uk" || (h.kind === "place" && h.alias !== h.id.replace(/-/g, " "));
  return part.some(isUk) || Boolean(next?.some(isUk));
}

/** Longest-first scan of a part's words against the dictionaries. */
function hitsIn(part: string): Hit[] {
  if (FOREIGN_CODES.has(part)) return [{ kind: "foreign" }];
  const words = part.split(" ");
  const hits: Hit[] = [];
  for (let i = 0; i < words.length; ) {
    let matched = 0;
    for (let n = Math.min(MAX_WORDS, words.length - i); n > 0 && !matched; n--) {
      const phrase = words.slice(i, i + n).join(" ");
      const hit = lookup(phrase);
      if (hit) {
        hits.push(hit);
        matched = n;
      }
    }
    i += matched || 1;
  }
  return hits;
}

function lookup(phrase: string): Hit | null {
  // Foreign first so "new york" beats "york" and "new south wales" beats "wales"
  if (FOREIGN.has(phrase)) return { kind: "foreign" };
  const id = ALIASES.get(phrase);
  if (id) return { kind: "place", id, alias: phrase };
  if (UK_MARKERS.has(phrase)) return { kind: "uk" };
  if (REMOTE.has(phrase)) return { kind: "remote" };
  return null;
}
