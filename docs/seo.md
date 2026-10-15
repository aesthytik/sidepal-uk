# Search visibility and maintenance

The canonical origin is `https://horus.to`. These changes prepare pages for crawling and indexing;
search position and rich results depend on Google and are not guaranteed.

## Verification on 15 October 2026

- 232 tests passed across 22 test files; ESLint and the production build passed.
- The build generated 434 static pages. Shared initial JavaScript fell from 205 kB to
  103 kB after deferring PostHog; this is a build measurement, not a Lighthouse score.
- The HTTP audit passed for 29 pages and sitemap files, plus robots discovery, API
  indexing headers and invalid pagination. It checked actual server-rendered results,
  sampled detail pages, page-specific canonical/social metadata and all six sitemap slices.
- Interactive browser testing was unavailable in this session. Typing, filtering,
  personalised sorting and load more still need a browser check after deployment.

## Technical changes

- `/jobs` and `/sponsors` render results in their initial HTML. Sponsor names link to their
  own profiles. The load-more controls have real `href` values, so the next results page
  works without JavaScript. Direct visits to later pages render that page's results.
- Unfiltered pagination has a separate title and self-referencing canonical. Invalid and
  out-of-range pages return a not-found response. Searches with filters, alternate sorting,
  or the map view have `noindex, follow`. Tracking parameters do not enter canonical URLs.
- Public pages share page-specific titles, descriptions, Open Graph and Twitter metadata.
  The home page alone declares its canonical as `/`. Saved items, profiles and admin pages
  declare `noindex` and remain crawlable so Google can read that directive.
- The PostHog SDK loads only after analytics consent, reducing the JavaScript needed for
  a first visit. Withdrawal during download is checked before initialisation.
- API responses, analytics endpoints and downloadable register data carry an `X-Robots-Tag`.
  Vercel preview and development deployments also carry `noindex, nofollow`.
- Organization and WebSite entities share stable identifiers. JSON-LD is escaped through
  the existing `JsonLd` component. FAQs match questions and answers visible on the page;
  FAQ markup does not imply eligibility for Google's restricted FAQ rich results.
- Only individual job pages may publish `JobPosting`. A full fetched description, valid
  original posting date, UK eligibility and a known location are required. A preview alone
  gets ordinary page metadata and breadcrumbs. Unknown expiry dates are omitted, and
  hybrid roles do not claim to be fully remote. Long descriptions are preserved in full.
- The hourly sitemap index references curated pages at `/sitemap/0.xml`, existing numeric
  sponsor slices and `/sitemap/jobs-N.xml` job slices. Each database slice holds at most
  40,000 URLs. Sponsor lookup failures throw instead of caching an empty successful slice.
  Job publication dates are not misreported as modification dates.

## Deployment checks

Run `npm run build`, start the production server with `npm start`, then run
`npm run check:seo -- http://localhost:3000`. This requests the actual HTML without running
JavaScript and checks results, detail links, pagination, metadata, robots rules and sitemap slices.
An interactive browser check should also cover typing, filters, load more and personalised sorting.

1. Deploy the changes, then verify the canonical origin as a property in
   [Google Search Console](https://search.google.com/search-console/about). DNS verification
   works for a domain property. For URL-prefix HTML verification, set `GOOGLE_SITE_VERIFICATION`
   to the supplied token and redeploy; the app emits the verification meta tag.
2. Submit `https://horus.to/sitemap.xml`. Check that every listed child sitemap returns valid
   XML and that sampled URLs return the expected page, canonical and indexability.
3. Use URL Inspection on the home page, `/jobs`, `/sponsors`, one sponsor profile, one
   occupation page and a complete job page. Check rendered content as well as discovery.
4. Test a complete job page in Google's
   [Rich Results Test](https://search.google.com/test/rich-results). A job with no original
   posting date or only a preview deliberately has no JobPosting markup.
5. Check mobile performance with [PageSpeed Insights](https://pagespeed.web.dev/), then
   monitor real-user Core Web Vitals in Search Console. Report measured results before
   deciding whether further performance changes are needed.

## Ongoing work

- Keep register imports, job-board indexing and the occupation snapshot current. An old
  role leaves the job pages and sitemap when it leaves the index. Monitor indexing failures;
  a stale upstream index cannot prove that an external role is still open.
- Preserve original publication dates from providers. If a provider supplies an explicit
  closing date, carry it through the index and pass it as `validThrough`; do not estimate it.
- When a provider confirms that a role has closed, remove it promptly. Google's Indexing API
  can accelerate job updates, but requires a verified property, service account and quota
  configuration. It is not configured by these code changes.
- Use Search Console queries and impressions to improve the existing role, place and salary
  pages with useful content. Keep licence status distinct from an employer's willingness to
  sponsor a particular role.

## References

- [Google: pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
- [Google: job posting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
- [Google: building and submitting sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: noindex rules](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
