# Horus

Find UK employers licensed to sponsor work visas, see their open roles, and track
your applications. Data comes from the GOV.UK
[Register of Licensed Sponsors: Workers](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).

## Features

- Search all ~127k sponsors by name, location, visa route and rating (shareable URLs)
- Website, careers page and **live open roles** for each sponsor, found on demand. Jobs are read
  from Greenhouse, Lever, Ashby and Workable public job board APIs, with UK roles first
- Shortlist tracker (Interested → Applied → Interviewing → Offer / Rejected), notes and CSV export,
  stored in the browser
- Daily refresh of the register via `/api/update-sponsors` (Vercel cron, see `vercel.json`)

## Development

```bash
npm install
npm run dev
npm test        # vitest
```

All data lives in Supabase (sponsors, jobs, enrichment). Copy the Supabase variables below into `.env`,
then load the latest GOV.UK register into the database:

```bash
curl -X POST localhost:3000/api/update-sponsors   # add -H "Authorization: Bearer $CRON_SECRET" if set
```

The daily job index runs in GitHub Actions (`.github/workflows/index-jobs.yml`) and writes to Supabase.
To run it locally: `npx ts-node-script --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' scripts/index-jobs.ts 5`.

## Code map

| Module                 | Interface                                                                    |
| ---------------------- | ---------------------------------------------------------------------------- |
| `src/lib/directory/`   | `searchSponsors`, `getSponsors`, `suggestLocations`, `directoryInfo`, `refreshFromGovUk` |
| `src/lib/enrichment/`  | `enrich(sponsors)` → website, careers page and job summary per sponsor. Built by `createEnricher({ store, http, resolves })` so tests inject a memory store and fake network |
| `src/lib/useSponsorSearch.ts` | Search state, kept in the URL; load-more paging                      |
| `src/lib/useEnrichment.ts`    | Batches `POST /api/enrich` for sponsors on screen                     |
| `src/store/useShortlist.ts`   | Saved sponsors and their application status (localStorage)          |

## Environment variables

| Variable                                    | Purpose                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Required.** Supabase project for reads (RLS limits it to public data) |
| `SUPABASE_SERVICE_ROLE_KEY`                 | **Required, server-only.** Register refresh, enrichment cache and the indexer |
| `OPENROUTER_API_KEY`                        | Optional. AI search and `scripts/classify-sectors.ts`    |
| `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | More accurate website lookup (falls back to DNS guesses) |
| `SPONSOR_CSV_URL`                           | Override the register CSV URL                            |
| `CRON_SECRET`                               | Require `Authorization: Bearer <secret>` on updates      |

The schema (tables, RLS policies and the `search_sponsors` function) is applied through Supabase migrations.
