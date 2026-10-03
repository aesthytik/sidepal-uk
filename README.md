# Sidepal

Find UK companies licensed to sponsor work visas. Data comes from the GOV.UK
[Register of Licensed Sponsors: Workers](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers).

## Features

- Search and filter the register by name, city, county, region and visa route (shareable URLs)
- Save sponsors (stored in the browser) and review them on the Saved page
- Company website and careers page are discovered on demand for the sponsors on screen
- Daily refresh of the register via `/api/update-sponsors` (Vercel cron, see `vercel.json`)

## Development

```bash
npm install
npm run dev
```

The newest CSV in `public/data` is loaded on start. Call `POST /api/update-sponsors`
to download the latest register from GOV.UK.

## Environment variables (all optional)

| Variable                                   | Purpose                                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| `GOOGLE_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | More accurate website lookup (falls back to DNS guesses) |
| `OPENAI_API_KEY`                           | Sector classification tags                              |
| `SPONSOR_CSV_URL`                          | Override the register CSV URL                           |
| `CRON_SECRET`                              | Require `Authorization: Bearer <secret>` on updates     |

On read-only hosts (e.g. Vercel) the enrichment cache and downloaded CSV are kept
in memory per instance rather than written to disk.
