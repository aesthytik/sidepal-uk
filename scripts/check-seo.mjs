import assert from "node:assert/strict";

// Run against a production build: npm run check:seo -- http://localhost:3000
// This checks the HTML a crawler receives, without executing client JavaScript.
const base = new URL(process.argv[2] ?? "http://localhost:3000");
const origin = "https://horus.to";
let checked = 0;
const failures = [];
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

async function request(path, status = 200) {
  const response = await fetch(new URL(path, base), {
    headers: { "User-Agent": "Googlebot" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(response.status, status, `${path}: HTTP status`);
  return { response, text: await response.text() };
}

function tags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))].map(([value]) =>
    Object.fromEntries([...value.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, content]) => [key, decode(content)]))
  );
}

async function page(path, canonical = path, noIndex = false) {
  const { text, response } = await request(path);
  const html = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const meta = tags(html, "meta");
  const content = (key) => meta.find((tag) => tag.name === key || tag.property === key)?.content;
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "");
  assert.ok(title && title.includes("Horus"), `${path}: title ${JSON.stringify(title)} (HTML starts ${JSON.stringify(html.slice(0, 250))})`);
  assert.ok(content("description"), `${path}: description`);
  if (!noIndex) assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path}: one visible H1`);
  const robots = content("robots") ?? "";
  assert.equal(/\bnoindex\b/.test(robots), noIndex, `${path}: indexing directive`);
  if (noIndex) assert.ok(!/(?:^|,\s*)index(?:,|$)/.test(content("googlebot") ?? ""), `${path}: conflicting Googlebot directive`);
  else {
    assert.ok(!/noindex/.test(response.headers.get("x-robots-tag") ?? ""), `${path}: production indexing header`);
    const normaliseUrl = (url) => url ? new URL(url).href : undefined;
    assert.equal(normaliseUrl(tags(html, "link").find((tag) => tag.rel === "canonical")?.href), normaliseUrl(`${origin}${canonical}`), `${path}: canonical`);
    assert.equal(normaliseUrl(content("og:url")), normaliseUrl(`${origin}${canonical}`), `${path}: social URL`);
    assert.equal(content("og:title"), title, `${path}: Open Graph title`);
    assert.equal(content("twitter:title"), title, `${path}: Twitter title`);
    assert.equal(content("og:description"), content("description"), `${path}: social description`);
  }
  const structured = [...text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));
  for (const posting of structured.filter((item) => item["@type"] === "JobPosting")) {
    assert.ok(posting.description?.trim(), `${path}: full job description`);
    assert.ok(Number.isFinite(Date.parse(posting.datePosted)), `${path}: posting date`);
    assert.ok(posting.hiringOrganization?.name, `${path}: hiring organisation`);
    assert.ok(posting.jobLocation || posting.jobLocationType === "TELECOMMUTE", `${path}: job location`);
  }
  checked++;
  console.log(`PASS ${path}`);
  return { html, structured, links: tags(html, "a").map((tag) => tag.href).filter(Boolean) };
}

async function main() {
  for (const path of ["/", "/about", "/visa-sponsors", "/visa-routes", "/visa-sponsorship-jobs", "/visa-salary-checker", "/guide/visa-basics"]) {
    try {
      const result = await page(path);
      if (["/visa-sponsors", "/visa-routes", "/visa-sponsorship-jobs", "/visa-salary-checker"].includes(path)) {
        const detail = result.links.find((href) => href.startsWith(`${path}/`));
        assert.ok(detail, `${path}: crawlable category link`);
        await page(detail);
      }
    } catch (error) { failures.push(error.message); }
  }
  for (const path of ["/jobs", "/sponsors"]) {
    const first = await page(path);
    const list = first.structured.find((item) => item["@type"] === "ItemList");
    assert.ok(list?.itemListElement.length > 0, `${path}: server-rendered results`);
    const detail = new URL(list.itemListElement[0].url).pathname;
    assert.ok(first.links.includes(detail), `${path}: visible crawlable detail link`);
    assert.ok(!first.structured.some((item) => item["@type"] === "JobPosting"), `${path}: no JobPosting on a list page`);
    await page(detail);
    if (first.links.includes(`${path}?page=2`)) {
      const second = await page(`${path}?page=2`);
      const secondList = second.structured.find((item) => item["@type"] === "ItemList");
      assert.equal(secondList.itemListElement[0].position, 21, `${path}: second page position`);
      assert.notEqual(secondList.itemListElement[0].url, list.itemListElement[0].url, `${path}: distinct second page`);
      assert.ok(second.links.includes(path), `${path}: previous-page link`);
    }
    await page(`${path}?q=engineer`, path, true);
    await request(`${path}?page=0`, 404);
    await request(`${path}?page=999999999`, 404);
  }
  await page("/jobs?utm_source=seo-check", "/jobs");
  for (const path of ["/saved", "/profile", "/admin/login"]) await page(path, path, true);
  const api = await request("/api/jobs?limit=1");
  assert.match(api.response.headers.get("x-robots-tag") ?? "", /noindex/, "API noindex header");
  const robots = (await request("/robots.txt")).text;
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), "robots sitemap discovery");
  assert.ok(!robots.includes("Disallow: /saved") && !robots.includes("Disallow: /profile"), "noindex pages remain crawlable");
  const index = (await request("/sitemap.xml")).text;
  assert.match(index, /<sitemapindex\b/, "sitemap index");
  const slices = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => new URL(decode(url)));
  assert.ok(slices.length, "sitemap slices");
  for (const slice of slices) {
    assert.equal(slice.origin, origin, "sitemap canonical origin");
    const { text } = await request(slice.pathname);
    assert.match(text, /<urlset\b/, `${slice.pathname}: sitemap format`);
    const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => new URL(decode(url)));
    assert.ok(urls.length > 0 && urls.length <= 50_000, `${slice.pathname}: sitemap size`);
    for (const url of urls) {
      assert.equal(url.origin, origin, "canonical sitemap URL");
      assert.equal(url.search, "", "no filtered URLs in sitemaps");
      assert.ok(!/^\/(?:saved|profile|admin|api)(?:\/|$)/.test(url.pathname), "no private URLs in sitemaps");
    }
    checked++;
    console.log(`PASS ${slice.pathname} (${urls.length} URLs)`);
  }
  await request("/sitemap/not-a-sitemap.xml", 404);
  assert.equal(failures.length, 0, failures.join("\n"));
  console.log(`SEO HTTP checks passed: ${checked} pages and sitemaps, plus indexing headers, robots.txt and invalid pagination.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
