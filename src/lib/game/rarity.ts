import type { Enrichment, Sponsor } from "../sponsorTypes";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/**
 * How good a find a sponsor is, as loot: A-rated is rare, A-rated and hiring
 * is epic, A-rated with UK roles that match what you're after is legendary.
 */
export function rarityOf(sponsor: Pick<Sponsor, "rating">, enrichment?: Enrichment): Rarity {
  if (!sponsor.rating.startsWith("A")) return "common";
  const jobs = enrichment?.jobs;
  if (!jobs || jobs.total === 0) return "rare";
  if (jobs.uk > 0 && (jobs.matching ?? 0) > 0) return "legendary";
  return "epic";
}
