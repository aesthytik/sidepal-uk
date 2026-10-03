/**
 * Skilled Worker salary rules. These change; re-check against GOV.UK
 * ("Skilled Worker visa: salary requirements") and update LAST_VERIFIED.
 */
export const THRESHOLDS = {
  general: 41_700, // GBP per year, general minimum from July 2025
  newEntrant: 33_400, // GBP per year, new entrants (e.g. recent graduates)
};
export const LAST_VERIFIED = "2026-10-03";
export const SOURCE_URL = "https://www.gov.uk/skilled-worker-visa/your-job";
