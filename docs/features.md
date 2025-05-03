# Features & Development Plan for UK Tech Visa Sponsor Finder

### Purpose

Build a fully serverless Next.js (React 18 / App Router) application that helps job‑seekers quickly find UK companies authorised to sponsor Skilled Worker and other tech‑friendly visas, enriched with direct links to each company’s careers page.

---

## 1. Data Ingestion & Daily Update Pipeline

**Goal:** Keep an enriched copy of the Home Office sponsor register in sync every 24 h.

1. **Fetch CSV** from official URL using `fetch()` in an API route or `getStaticProps` with revalidation.
2. **Parse & normalise** into JSON:

   - Merge duplicate org names.
   - Combine `Town/City` & `County` → `region`.
   - Preserve `Rating`, `Route`, `Sponsor Type`.

3. **Enrich with AI**

   - Prompt GPT‑4 to return the official domain (`https://{domain}`) for each company.
   - Retry with fallback model if ambiguous.
   - Persist the mapping so unchanged orgs don’t re‑query.

4. **Sector classification**

   - For each company: `sector = classify(homepage_text)` (IT/Software, Finance, Education …).
   - Store as first‑level filter key.

5. **Career page discovery**

   - Test common paths (`/careers`, `/jobs`, `/join‑us`).
   - If none succeed, scan homepage links for keywords.
   - Save `careerUrl` if found.

6. **Caching strategy**

   - Write result to `sponsors.json` in `/public/data`.
   - On edge, use global in‑memory cache for same‑day reads.

7. **Scheduling**

   - Deploy a Vercel Cron Job: `0 4 * * *` UTC → hit `/api/update-sponsors`.

---

## 2. API Routes (serverless)

| Route                  | Method | Purpose                                                                |
| ---------------------- | ------ | ---------------------------------------------------------------------- |
| `/api/update-sponsors` | `POST` | Trigger full fetch‑parse‑enrich‑save cycle.                            |
| `/api/companies`       | `GET`  | Return filtered list via query params `sector`, `region`, `visa`, `q`. |
| `/api/enrich-company`  | `POST` | (Dev only) Enrich a single company; used for retries.                  |
| `/api/health`          | `GET`  | Simple OK check for uptime monitoring.                                 |

---

## 3. Front‑end Pages & Routing

1. **Home (`/`)** – Hero, quick search & top filters (sector = IT default).
2. **Sponsors (`/sponsors`)** – Main searchable directory (client‑side virtualised list).
3. **Saved (`/saved`)** – User’s bookmarked sponsors (localStorage).
4. **FAQ / Guides (`/guide/visa-basics`, `/guide/how-to-apply`)** – Markdown articles.
5. **404 & Error** – Friendly pages explaining next steps.

---

## 4. Core UI Components

- **SearchBar** – Debounced free‑text search using Fuse.js.
- **FilterPanel** – Sector multi‑select, Visa badges, Region dropdown, Clear button.
- **CompanyCard** – Displays name, region, sector badge, visa chips, buttons:

  - `Website` ↗
  - `Careers` ↗ (if `careerUrl` exists)
  - `♡ Save`

- **ResultsList** – Virtualised list (react‑window) or infinite scroll.
- **SavedToggle** – Heart icon + tooltip.
- **MobileFilterDrawer** – Slide‑in filters for ≤ md screens.
- **Toast / Snackbar** – Feedback on save / errors.
- **LoadingSkeletons** – Shimmer for list while data loads.

---

## 5. State Management & Persistence

- Global filter/search context via **Zustand** (lightweight, SSR‑friendly).
- Saved sponsors in **localStorage**; hydrate on mount.
- URL query params reflect filter state for shareable links.

---

## 6. AI Integration Details

| Task            | Model  | Prompt Sketch                                                        | Notes                        |
| --------------- | ------ | -------------------------------------------------------------------- | ---------------------------- |
| Domain lookup   | GPT‑4o | “Return ONLY the official website domain for the UK company ‘X Ltd’” | Temperature 0, max 16 tokens |
| Sector classify | GPT‑4o | “Classify the industry sector of this website HTML: …”               | Map to `IT`, `Finance`, etc. |
| Error handling  | —      | Automatic fallbacks to Bing search or manual review queue.           | Store `enrichStatus`.        |

Manage costs: cache results, chunk calls (100/min), environment var `OPENAI_KEY`.

---

## 7. Performance, SEO & Accessibility

- **ISR**: `revalidate: 86400` ensures fresh build daily.
- **Edge Runtime** for `/api/companies` to reduce latency.
- `next/image` + `ImageResponse` for social share OG image.
- **Lighthouse targets**: Perf > 90, A11y > 95.
- Use semantic HTML, aria‑labels on buttons, `prefers‑color‑scheme`.

---

## 8. Deployment & DevOps

- **Vercel project** with Preview & Prod envs.
- Secrets: `OPENAI_API_KEY`, `CRON_SECRET`.
- Cron job in `vercel.json`:

  ```json
  {
    "crons": [{ "path": "/api/update-sponsors", "schedule": "0 4 * * *" }]
  }
  ```

- **Monitoring**: Vercel Analytics + `/api/health`.

---

## 9. MVP Timeline (13 days)

| Day | Deliverable                                     |
| --- | ----------------------------------------------- |
| 1‑2 | Repo setup, CSV fetch & parse, raw JSON saved.  |
| 3‑4 | ISR or Cron pipeline; cache verified.           |
| 5‑6 | API `/api/companies` with basic filters.        |
| 7‑8 | Front‑end directory page with search/filter UI. |
| 9   | AI domain enrichment, website links surfaced.   |
| 10  | Sector classification + visa badges.            |
| 11  | Careers page detector.                          |
| 12  | Saved sponsors with localStorage.               |
| 13  | Polishing, mobile UX, lighthouse pass, deploy.  |

---

## 10. Future Enhancements

- **Job scraping**: parse career pages for titles & feed into UI.
- **Email alerts**: “New IT sponsors this week” (would need backend/email).
- **User accounts** (Auth → track saves across devices).
- **Browser extension** to overlay sponsorship info on LinkedIn job ads.
- **Multi‑language** UI for non‑native speakers (i18n routing).
- **Analytics dashboard**: top searched sectors & regions.

---

### Ready to start 🚀

Use this doc as the single source of features, tasks and scope. Adjust timelines and priorities as development progresses.
