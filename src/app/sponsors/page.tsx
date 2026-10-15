import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { searchSponsors } from "@/lib/directory";
import { breadcrumbs, itemList, pageMetadata, sponsorPath } from "@/lib/seo";
import { type PageSearchParams, pageSearchParams, parseSearchParams, searchPageSeo, searchQueryKey, validPage } from "@/lib/searchParams";
import { SponsorSearch } from "./SponsorSearch";

type Props = { searchParams: Promise<PageSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, canonical, noIndex } = searchPageSeo("/sponsors", pageSearchParams(await searchParams));
  return pageMetadata({
    title: `UK Visa Sponsor List & Licensed Employers${page > 1 ? ` – Page ${page}` : ""}`,
    description: "Search the Home Office register of licensed UK visa sponsors. Find employers by company, location and visa route, with careers pages and open jobs.",
    path: canonical,
    noIndex,
  });
}

export const revalidate = 3600;

export default async function SponsorsPage({ searchParams }: Props) {
  const params = pageSearchParams(await searchParams);
  if (!validPage(params)) notFound();
  const query = parseSearchParams(params);
  const initial = await searchSponsors({ ...query, limit: 20 }).catch(() => undefined);
  if (initial && (query.page ?? 1) > initial.pageCount) notFound();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Find sponsors", path: "/sponsors" },
          ]),
          ...(initial?.items.length
            ? [itemList(initial.items.map((s) => ({ name: s.name, path: sponsorPath(s.id) })), (initial.page - 1) * 20)]
            : []),
        ]}
      />
      <Suspense>
        <SponsorSearch initial={initial ? { ...initial, queryKey: searchQueryKey(query) } : undefined} />
      </Suspense>
    </>
  );
}
