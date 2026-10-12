"use client";

import { CompanyCard } from "@/components/CompanyCard";
import type { Sponsor } from "@/lib/sponsorTypes";
import { useEnrichment } from "@/lib/useEnrichment";

/** The interactive part of a sponsor page: live lookup of website and roles, plus saving. */
export function SponsorLive({ sponsor }: { sponsor: Sponsor }) {
  const enrichment = useEnrichment([sponsor.id]);
  return <CompanyCard sponsor={sponsor} enrichment={enrichment.get(sponsor.id)} pending={enrichment.isPending(sponsor.id)} />;
}
