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

The newest CSV in `public/data` is loaded on start. To download the latest register:

```bash
curl -X POST localhost:3000/api/update-sponsors   # add -H "Authorization: Bearer $CRON_SECRET" if set
```

## Code map

| Module                 | Interface                                                                    |
| ---------------------- | ---------------------------------------------------------------------------- |
| `src/lib/directory/`   | `searchSponsors`, `getSponsors`, `suggestLocations`, `directoryInfo`, `refreshFromGovUk` |
| `src/lib/enrichment/`  | `enrich(sponsors)` → website, careers page and job summary per sponsor. Built by `createEnricher({ store, http, resolves })` so tests inject a memory store and fake network |
| `src/lib/useSponsorSearch.ts` | Search state, kept in the URL; load-more paging                      |
| `src/lib/useEnrichment.ts`    | Batches `POST /api/enrich` for sponsors on screen                     |
| `src/store/useShortlist.ts`   | Saved sponsors and their application status (localStorage)          |

## Environment variables (all optional)

| Variable                                    | Purpose                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | More accurate website lookup (falls back to DNS guesses) |
| `SPONSOR_CSV_URL`                           | Override the register CSV URL                            |
| `CRON_SECRET`                               | Require `Authorization: Bearer <secret>` on updates      |

On read-only hosts (e.g. Vercel) the enrichment cache and a refreshed register are
kept in memory per instance rather than written to disk.
