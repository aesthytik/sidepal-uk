# Horus

Find UK employers licensed to sponsor work visas, see their open roles, and track
your applications. Data comes from the GOV.UK
[Register of Licensed Sponsors: Workers](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).

## Features

- Search all ~127k sponsors by name, location, visa route and rating (shareable URLs)
- Website, careers page and **live open roles** for each sponsor, found on demand. Jobs are read
  from Greenhouse, Lever, Ashby and Workable public job board APIs, with UK roles first
- **My profile**: upload a CV (PDF, .docx or text, read in the browser) or pick skills, roles, places, salary floor and
  visa situation. Every job gets a match score with reasons, a "Best match for me" sort, and a sponsorship check that
  uses the new-entrant salary rate when it applies. Stored in the browser; AI reading of the CV is opt-in
- **Visa salary checker** (`/visa-salary-checker`): job titles are matched to SOC 2020 occupation codes, and every
  sponsorship check uses that occupation's going rate, new-entrant rate, Temporary Shortage List or health/education
  pay-scale rules, and whether it's open to new applicants at all. Data is a snapshot of the Immigration Rules,
  refreshed with `node --no-warnings scripts/update-going-rates.ts`
- **Tailor my application** on any job: fetches the full ad from the job board, shows which of its keywords your
  profile/CV covers (no AI), and, opt-in, uses AI to suggest CV bullets in the ad's language and draft a cover letter
  that is upfront about needing sponsorship
- **Prep for interview** next to Tailor: opt-in AI practice questions grouped by theme, with technical and behavioural
  STAR outlines backed by quotes from your CV/experience summary and honest gaps to fill. Includes employer questions,
  a script matched to your profile's visa situation, and copy/print controls. Opening the panel does not send your profile
  or CV to AI; generation sends them through OpenRouter for that request. Results are not saved
- **Daily quest**: once you have a profile, Horus picks three strong matches each day (stable all day, different
  employers, swappable). Apply to any one to complete the quest and grow your 🔥 streak (XP and achievements)
- Tracker for saved **jobs and sponsors** (Interested → Applied → Interviewing → Offer / Rejected) as a board or
  list, with notes and CSV export. After clicking Apply, one tap tracks the job as applied; follow-up reminders are
  set automatically (a week after applying, two days after an interview), shown when due, and downloadable as
  calendar events. Stored in the browser
- Daily refresh of the register via `/api/update-sponsors` (Vercel cron, see `vercel.json`)
- [Sponsor register changes](/sponsors/new): new listings, removals, rating and visa route changes,
  filterable by location and change type, with observed licence dates and recent history on sponsor pages

## Development

```bash
npm install
npm run dev
npm test        # vitest
npm run lint   # ESLint
npm run build  # production build (requires access to Supabase)
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
| `src/lib/directory/changes.ts` | Pure `diffSponsors(previous, current)` and `createChangeRecorder({ store })` for injected persistence; `changeQueries.ts` reads the feed and sponsor history |
| `src/lib/enrichment/`  | `enrich(sponsors)` → website, careers page and job summary per sponsor. Built by `createEnricher({ store, http, resolves })` so tests inject a memory store and fake network |
| `src/lib/useSponsorSearch.ts` | Search state, kept in the URL; load-more paging                      |
| `src/lib/useEnrichment.ts`    | Batches `POST /api/enrich` for sponsors on screen                     |
| `src/store/useShortlist.ts`   | Saved sponsors and jobs, their application status and follow-up dates (localStorage) |
| `src/lib/soc/`         | `OCCUPATIONS` (GOV.UK snapshot), `salaryRule(occupation, who)`, `matchOccupation(title)` |
| `src/lib/quest/`       | `pickDaily(candidates, day, exclude)` (deterministic per day), `questStreak(days, today)` |
| `src/lib/tracker/`     | Follow-up dates (`followUpFor`, `dueState`) and `.ics` calendar events |
| `src/lib/profile/`     | `extractProfile(cvText)`, the skills lexicon, `sanitizeProfile`, `readCv(file)` (browser only) |
| `src/lib/ai/interviewPrep.ts` | Pure interview-prep input handling, prompt, nested response validation, visa scripts and copy/print text |
| `src/lib/match/`       | `scoreJob(job, profile)` → 0–100 with reasons; `rankJobs` for the "match" sort |
| `src/store/useProfile.ts`     | The user's profile (localStorage); CV text only kept if they opt in   |

## Environment variables

| Variable                                    | Purpose                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Required.** Supabase project for reads (RLS limits it to public data) |
| `SUPABASE_SERVICE_ROLE_KEY`                 | **Required, server-only.** Register refresh, enrichment cache and the indexer |
| `OPENROUTER_API_KEY`                        | Optional. AI search, job checks, CV reading, tailoring, interview prep and `scripts/classify-sectors.ts`. Uses free models by default (see `src/lib/ai/openrouter.ts`); `OPENROUTER_MODEL` overrides |
| `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | More accurate website lookup (falls back to DNS guesses) |
| `SPONSOR_CSV_URL`                           | Override the register CSV URL                            |
| `GOOGLE_SITE_VERIFICATION`                 | Optional. Search Console HTML verification token (token only) |
| `CRON_SECRET`                               | Require `Authorization: Bearer <secret>` on updates      |

The schema (tables, RLS policies and the `search_sponsors` function) is applied through Supabase migrations.

## Search visibility

Public search pages render the first results on the server and expose real pagination links.
Filtered and personalised searches use `noindex, follow`; unfiltered later pages have their own
canonical URL. Public page metadata is shared through `pageMetadata` in `src/lib/seo.ts`.
The sitemap index at `/sitemap.xml` separates curated pages, sponsor slices and job slices.

After deployment, verify `https://horus.to` in Google Search Console and submit `sitemap.xml`.
See [the SEO maintenance notes](docs/seo.md) for validation steps and data requirements.

The register change feed needs `supabase/migrations/20261015120000_sponsor_register_changes.sql`
before the next refresh. It adds public, read-only history and a service-role-only RPC that saves each
refresh batch and its events together. The initial import into an empty directory establishes a baseline;
it does not label all sponsors as newly licensed. Existing directories are compared from the first refresh
after the migration. History uses organisation names, retains removed sponsors, and deduplicates retries
of the same CSV. First-seen dates are observations, not original licence grant dates; name changes appear
as a removal and a new listing because the register provides no stable organisation identifier.
