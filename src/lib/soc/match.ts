import { OCCUPATIONS, type Occupation, occupationByCode } from "./index";

/**
 * Guesses the SOC 2020 occupation for a job title, the way an employer would pick one
 * for a certificate of sponsorship. Modern titles GOV.UK doesn't list go through
 * ALIASES; everything else is matched against GOV.UK's example job titles.
 */

export interface OccupationMatch {
  occupation: Occupation;
  confidence: "high" | "medium";
}

// Checked in order, so specific titles come before general ones
const ALIASES: [RegExp, string][] = [
  [/\b(cto|chief technology officer|vp (of )?engineering|head of (it|technology))\b/, "1137"],
  [/\b(head of sales|sales director|director of sales|vp (of )?sales|chief revenue officer|cro)\b/, "1132"],
  [/\b(engineering manager|head of engineering|software development manager|director of engineering)\b/, "2132"],
  [/\b(product owner|(technical |tech |it )?product manager|head of product)\b/, "2132"],
  [/\b(qa|test|testing|sdet|quality assurance|automation test)( automation)? (engineer|analyst|lead|tester)\b|\btester\b/, "2136"],
  [/\b(security|cyber|cybersecurity|appsec|penetration|pen) ?(engineer|analyst|architect|tester|specialist|consultant)\b|\bsoc analyst\b/, "2135"],
  [/\b(devops|dev ops|sre|site reliability|platform|cloud|infrastructure|reliability|build|release) (engineer|architect|specialist)\b|\bdevops\b/, "2139"],
  [/\b(data|solutions?|systems?|enterprise|software|technical|cloud|it|principal|customer|staff|lead|chief|platform|integration|ai|ml|application|domain) architect\b|\b(data|analytics|bi) engineer\b|\bit business analyst\b/, "2133"],
  [/\b(network|networks) (engineer|administrator|architect)\b/, "2137"],
  [/\b(data scientist|statistician|actuar|quantitative (analyst|researcher)|quant (analyst|researcher)|economist)\w*\b/, "2433"],
  [/\b(machine learning|ml|ai|deep learning|computer vision|nlp|llm) (engineer|developer|scientist|researcher)\b|\bresearch engineer\b/, "2134"],
  [/\b(research scientist|research fellow|research associate|postdoc\w*|postdoctoral researcher)\b/, "2162"],
  [/\b(sales engineer|solutions engineer|solutions consultant|pre-?sales (engineer|consultant))\b/, "3552"],
  [/\b(mechanical )?design engineer\b/, "2122"],
  [/\b(software|backend|back end|back-end|frontend|front end|front-end|full ?stack|full-stack|mobile|ios|android|web|game|games|embedded|firmware|python|java|javascript|typescript|react|node|golang|go|ruby|php|\.net|c\+\+|c#|rust|scala|kotlin|swift|application|applications|blockchain|smart contract)( \w+)? (engineer|engineering|developer|programmer|dev)\b|\b(developer|programmer|swe)\b/, "2134"],
  [/\b(ux|ui|ux\/ui|ui\/ux|product|interaction|web|visual) (designer|researcher|design lead)\b|\buser researcher\b/, "2141"],
  [/\b(it support|service desk|help ?desk|desktop support|it technician|technical support (analyst|engineer))\b/, "3132"],
  [/\bdata analyst\b|\b(bi|business intelligence|reporting|insights?) analyst\b/, "3544"],
  [/\b(business systems analyst|contract administrator|clinical coder|research coordinator)\b/, "3549"],
  [/\b(business analyst)\b/, "2431"],
  [/\b(financial|finance|investment|credit|equity|fp&a) analyst\b/, "2422"],
  [/\b(accountant|aca|acca|cima|auditor|audit (manager|senior|associate))\b/, "2421"],
  [/\b(solicitor|lawyer|legal counsel|associate (solicitor|lawyer)|in-house counsel)\b/, "2412"],
  [/\b(account executive|sales executive|sdr|bdr|sales development representative|business development representative)\b/, "3552"],
  [/\b(account manager|business development manager|sales manager|partnerships manager|key account manager)\b/, "3556"],
  [/\b(marketing manager|growth manager|product marketing manager|commercial manager)\b/, "2432"],
  [/\b(recruiter|talent acquisition|recruitment consultant|hr advisor|hr adviser|people partner)\b/, "3571"],
  [/\b(mental health nurse|rmn|psychiatric nurse)\b/, "2235"],
  [/\b(children'?s nurse|paediatric nurse|rsc?n)\b/, "2236"],
  [/\b(midwife|midwives)\b/, "2231"],
  [/\b(district nurse|community nurse|practice nurse|health visitor)\b/, "2232"],
  [/\b(nurse practitioner|advanced nurse)\b/, "2234"],
  [/\b(registered nurse|staff nurse|rgn|nurse)\b/, "2237"],
  [/\b(senior (care|support) worker|senior carer)\b/, "6136"],
  [/\b(care worker|carer|support worker|care assistant|healthcare assistant)\b/, "6135"],
  [/\b(hgv|lgv|lorry|class (1|2)|c\+e) driver\b/, "8211"],
  [/\b(delivery|multi-drop|van) driver\b|\bcourier\b/, "8214"],
  [/\b(sous chef|head chef|chef de partie|commis chef|pastry chef|chef)\b/, "5434"],
];

// Seniority, contract and location words that don't change the occupation
const NOISE = new Set(
  "senior sr snr junior jr lead staff principal mid level graduate grad trainee apprentice intern internship entry i ii iii iv v 1 2 3 4 uk london remote hybrid contract permanent ftc fixed term part full time temporary temp locum the a an of and for in with x".split(
    " "
  )
);
// Words in GOV.UK titles that say little about the job
const FILLER = new Set("and of in the other related professional professionals occupation occupations elsewhere classified not nec".split(" "));
// Job words so common they can't identify an occupation alone ("Engineer", "Manager, Solutions")
const GENERIC = new Set(
  "engineer manager consultant associate director officer specialist analyst lead leader team head assistant executive adviser advisor technician worker operative partner coordinator administrator supervisor representative operation service services general business"
    .split(" ")
    .map((w) => (w.length > 3 && /[^su]s$/.test(w) ? w.slice(0, -1) : w))
);
const weight = (t: string) => (GENERIC.has(t) ? 0.3 : 1);
const sum = (ts: string[]) => ts.reduce((n, t) => n + weight(t), 0);

const stem = (w: string) => (w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && /[^su]s$/.test(w) ? w.slice(0, -1) : w);
const words = (s: string, drop: Set<string>) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .split(" ")
    .filter((w) => w && !drop.has(w))
    .map(stem);

interface Phrase {
  code: string;
  tokens: string[];
}

let phrases: Phrase[] | null = null;
function allPhrases(): Phrase[] {
  phrases ??= OCCUPATIONS.flatMap((o) =>
    // "Design occupations not elsewhere classified" is a catch-all, so only its listed jobs count
    [...(/not elsewhere classified/i.test(o.title) ? [] : [o.title]), ...o.examples]
      .map((p) => ({ code: o.code, tokens: words(p, FILLER) }))
      .filter((p) => p.tokens.length)
  );
  return phrases;
}

/** "Senior DevOps Engineer - London (Hybrid)" -> "devops engineer", the part that names the job. */
export function cleanTitle(title: string): string {
  const main = title.split(/ [-–—|] |,|\(|\[|:| \/ /)[0] || title;
  return words(main, NOISE).join(" ");
}

/** Every occupation scored against a title, best first. */
export function rankOccupations(title: string, limit = 5): { occupation: Occupation; score: number }[] {
  const job = cleanTitle(title).split(" ").filter(Boolean);
  if (!job.length) return [];
  const best = new Map<string, number>();
  for (const p of allPhrases()) {
    const head = p.tokens.find((t) => !GENERIC.has(t)) && [...p.tokens].reverse().find((t) => !/^(nursing|hospital|medical|professional)$/.test(t));
    if (!head || !job.includes(head)) continue; // "Software developers" must match "developer"
    const hits = p.tokens.filter((t) => job.includes(t));
    if (!hits.some((t) => !GENERIC.has(t))) continue; // At least one telling word
    const score = 0.7 * (sum(hits) / sum(p.tokens)) + 0.3 * (sum(hits) / sum(job));
    if (score > (best.get(p.code) ?? 0)) best.set(p.code, score);
  }
  return [...best]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([code, score]) => ({ occupation: occupationByCode(code)!, score: Math.round(score * 100) / 100 }));
}

const cache = new Map<string, OccupationMatch | null>();

/** The most likely occupation for a job title, or null when it isn't clear enough to say. */
export function matchOccupation(title: string): OccupationMatch | null {
  if (cache.has(title)) return cache.get(title)!;
  const text = ` ${cleanTitle(title)} `;
  const raw = ` ${title.toLowerCase()} `;
  let out: OccupationMatch | null = null;
  const alias = ALIASES.find(([re]) => re.test(text) || re.test(raw));
  if (alias) out = { occupation: occupationByCode(alias[1])!, confidence: "high" };
  else {
    const [top] = rankOccupations(title, 1);
    if (top && top.score >= 0.6) out = { occupation: top.occupation, confidence: top.score >= 0.9 ? "high" : "medium" };
  }
  if (cache.size > 5000) cache.clear();
  cache.set(title, out);
  return out;
}

/** Likely occupations for a title, best first: the confident match, then other close ones. */
export function suggestOccupations(title: string, limit = 4): Occupation[] {
  const best = matchOccupation(title)?.occupation;
  const rest = rankOccupations(title, limit + 1)
    .filter((r) => r.score >= 0.4 && r.occupation.code !== best?.code)
    .map((r) => r.occupation);
  return (best ? [best, ...rest] : rest).slice(0, limit);
}
