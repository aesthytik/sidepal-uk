# End‑to‑End Implementation Guide 🚀

> This guide stitches together **FEATURES.md**, the **Project Plan**, and **BRANDING.md** into a day‑by‑day execution script **plus copy‑paste AI prompts**. Follow sequentially or parallelise where your team size permits.

---

## 0 · Prerequisites & Environment

1. **Install tooling**

   ```bash
   npx create-next-app@latest uk‑tech‑sponsors --ts --turbo --app
   cd uk‑tech‑sponsors
   pnpm add tailwindcss postcss autoprefixer @heroicons/react zustand
   pnpm add -D vitest @testing-library/react vite-tsconfig-paths playwright
   npx tailwindcss init -p
   ```

2. **GitHub repo** – push initial commit, enable branch protection.
3. **Vercel project** – connect main, set env vars `OPENAI_API_KEY`, `CRON_SECRET` (random 32 chars).

---

## 1 · Data Pipeline (Days 1‑3)

### 1.1  CSV Download & Parse

```ts
// /lib/fetchCsv.ts
export async function fetchSponsorCsv() {
  const res = await fetch(
    "https://assets.publishing.service.gov.uk/.../Worker_and_Temporary_Worker.csv"
  );
  const text = await res.text();
  // use papaparse or csv‑parse to output objects
}
```

> **Prompt #1 – CSV parser** > _“Write a TypeScript function that converts the sponsor CSV (sample 3 rows) into an array of objects with keys: name, city, county, route, rating.”_

### 1.2  AI Domain Lookup

```ts
import OpenAI from "openai";
const openai = new OpenAI();
export async function enrichDomain(name: string, town?: string) {
  const { choices } = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Return ONLY the official website URL for the UK company "${name}"${
          town ? ` in ${town}` : ""
        }. If unsure, respond "unknown".`,
      },
    ],
  });
  return choices[0].message.content.trim();
}
```

> **Prompt #2 – Bulk enrichment script** > _“Generate a Node script that loops through 10 000 sponsor records, calls `enrichDomain`, caches results in a Map, respects 90 req/min throughput, and writes JSON to `/public/data/sponsors.json`.”_

### 1.3  Sector Classification & Career Page Discovery

> **Prompt #3 – Sector classifier** > _“Create a GPT‑4o function that takes a company name + homepage HTML and returns one of {IT, Finance, Healthcare, Education, Retail, Other}. Return lowercase single word.”_

> **Prompt #4 – Careers crawler** > _“Write a TypeScript util that tests common paths (‘/careers’, ‘/jobs’, …) and scans homepage `<a>` tags for ‘careers’ keyword, returning the first valid URL or null.”_

Wire these in `/api/update-sponsors` (Edge Function) and schedule with `vercel.json`:

```json
{
  "crons": [{ "path": "/api/update-sponsors", "schedule": "0 4 * * *" }]
}
```

---

## 2 · API Layer (Days 4‑5)

| File                      | Responsibility                                                                |
| ------------------------- | ----------------------------------------------------------------------------- |
| `/api/companies/route.ts` | Edge‑optimized GET; parse search params, filter JSON; cache `revalidate: 60`. |
| `/api/health/route.ts`    | Return `{status:'ok', lastUpdate}` for uptime.                                |

> **Prompt #5 – Filtering util** > _“Provide a pure function `filterCompanies(list, {sector?, visa?, region?, q?})` utilising Fuse.js for fuzzy search.”_

---

## 4 · AI‑Driven Screens (Day 9‑10)

- Integrate live search hitting `/api/companies` via SWR.
- Pre‑load IT‑sector default on mount.
- Use `react-window` for virtualised 10k rows.

> **Prompt #7 – React window list** > _“Generate a TypeScript component wrapping VariableSizeList to render `CompanyCard` with infinite scroll placeholder skeletons.”_

---

## 5 · Career Links & Bookmarks (Day 11‑12)

1. Show `Careers` button only if `careerUrl` present; else fallback `Search Google` link.
2. `useSavedSponsors.ts` (Zustand + localStorage) – persist IDs.
3. `/saved/page.tsx` list starred companies.

> **Prompt #8 – Bookmark hook** > _“Write a Zustand store with `savedIds: Set<string>`, `toggle(id)`, `isSaved(id)` that syncs to localStorage.”_

---

## 6 · Polish & Brand Compliance (Day 12)

- Implement **dark‑mode** Toggle (use `next-themes`).
- Replace accent colours & gradients per BRANDING.md.
- Add Framer Motion reveal on section headings.

> **Prompt #9 – Neo‑Brutalism variant** > _“Generate Tailwind component modifiers (classNames) that, when `data-style='nb'`, switch cards to thick black 2px borders, offset 4px drop‑shadow, flat background, no gradients.”_

---

## 7 · Testing & QA (Day 13)

- Run **Vitest** on utils; **Playwright** script: search ‘London’ filter IT, expect >0 results.
- Lighthouse CI (`pnpm dlx lhci autorun --upload.target=temporary-public-storage`).

---

## 8 · Deploy & Launch (Day 14)

1. Merge to `main`, confirm Vercel preview green.
2. Point domain (e.g. `techsponsors.uk`) to Vercel.
3. Final smoke: mobile Safari, Android Chrome.
4. Post launch tweet & LinkedIn release.
5. Create GitHub Discussions for feedback.

---

## Continuous Improvements

- **Post‑launch** backlog: job scraping, email alerts, auth.
- Set up **Sentry** for error monitoring, Cron Slack notifications.

---

### Copy‑able Quick Prompts List

| #   | Purpose           | Snippet                                 |
| --- | ----------------- | --------------------------------------- |
| 0   | Tailwind theme    | _see above_                             |
| 1   | CSV parser        | “Convert sponsor CSV to JS objects …”   |
| 2   | Bulk enrichment   | “Node script loops 10K records …”       |
| 3   | Sector classifier | “Classify industry sector …”            |
| 4   | Careers crawler   | “Find careers page util …”              |
| 5   | Filtering util    | “Pure function filterCompanies …”       |
| 6   | Glitch hero       | (long design prompt)                    |
| 7   | Virtual list      | “VariableSizeList wrapper …”            |
| 8   | Bookmark hook     | “Zustand store with savedIds …”         |
| 9   | Neo‑Brutalism     | “Tailwind modifiers for thick border …” |

> Keep this doc open alongside **FEATURES.md** + **BRANDING.md**. Mark items ✅ as you go. Happy shipping! 🛠️✨
