"use client";

import { useEffect, useId, useState } from "react";
import type { SearchFilters as Filters } from "@/lib/searchParams";
import { ROLE_FAMILIES, SECTORS, roleFamily, sectorLabel } from "@/lib/sectors/taxonomy";
import { POPULAR_LOCATIONS, VISA_CATEGORIES } from "@/lib/sponsorTypes";
import { SearchBar } from "./SearchBar";
import { Chip } from "./ui/chip";
import { MapPinIcon } from "./ui/icons";

const VISIBLE_VISAS = 4;

/** Town/county suggestions from the register, fetched as the user types. */
function useLocationSuggestions(text: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/locations?q=${encodeURIComponent(text)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then(setSuggestions)
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [text]);
  return suggestions;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2.5 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function SearchFilters({
  filters,
  onChange,
  showSponsored = false,
}: {
  filters: Filters;
  onChange: (changes: Partial<Filters>, options?: { replace?: boolean }) => void;
  showSponsored?: boolean; // Jobs page only: filter to roles that look sponsorable
}) {
  const listId = useId();
  const [locationText, setLocationText] = useState(filters.location ?? "");
  const suggestions = useLocationSuggestions(locationText);
  const [showAllVisas, setShowAllVisas] = useState(false);

  useEffect(() => setLocationText(filters.location ?? ""), [filters.location]);

  const visas =
    showAllVisas || (filters.visa && VISA_CATEGORIES.indexOf(filters.visa) >= VISIBLE_VISAS)
      ? VISA_CATEGORIES
      : VISA_CATEGORIES.slice(0, VISIBLE_VISAS);

  return (
    <div className="space-y-6">
      <Section title="Location">
        <SearchBar
          value={filters.location ?? ""}
          onSearch={(location) => onChange({ location }, { replace: true })}
          onTextChange={setLocationText}
          placeholder="Town, city or county"
          label="Location"
          icon={<MapPinIcon width={18} height={18} />}
          list={listId}
          delay={500}
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LOCATIONS.map((place) => (
            <Chip
              key={place}
              selected={filters.location?.toLowerCase() === place.toLowerCase()}
              onClick={() =>
                onChange({ location: filters.location?.toLowerCase() === place.toLowerCase() ? undefined : place })
              }
            >
              {place}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Visa route">
        <div className="flex flex-wrap gap-2">
          {visas.map((visa) => (
            <Chip
              key={visa}
              selected={filters.visa === visa}
              onClick={() => onChange({ visa: filters.visa === visa ? undefined : visa })}
            >
              {visa}
            </Chip>
          ))}
          {visas.length < VISA_CATEGORIES.length && (
            <button
              type="button"
              className="h-9 px-2 text-sm font-medium text-primary hover:underline"
              onClick={() => setShowAllVisas(true)}
            >
              + {VISA_CATEGORIES.length - visas.length} more
            </button>
          )}
        </div>
      </Section>

      <Section title="Role (narrows by likely sector)">
        <div className="flex flex-wrap gap-2">
          {ROLE_FAMILIES.map(({ id, label }) => (
            <Chip
              key={id}
              selected={filters.role === id}
              onClick={() => onChange({ role: filters.role === id ? undefined : id })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Sector (estimated from company name)">
        <div className="flex flex-wrap gap-2">
          {SECTORS.map(({ id, label }) => (
            <Chip
              key={id}
              selected={filters.sector === id}
              onClick={() => onChange({ sector: filters.sector === id ? undefined : id })}
            >
              {label}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          The register has no job or industry data, so sectors are guessed from company names. Companies with unclear
          names are hidden when a sector is chosen.
        </p>
      </Section>

      {showSponsored && (
        <Section title="Sponsorship">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
              checked={filters.sponsored === "likely"}
              onChange={(e) => onChange({ sponsored: e.target.checked ? "likely" : undefined })}
            />
            <span>
              Likely sponsorable only
              <span className="block text-muted-foreground">
                Salary meets the minimum or the ad mentions sponsorship. A rough guide, not advice.
              </span>
            </span>
          </label>
        </Section>
      )}

      <Section title="Sponsor rating">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
            checked={filters.rating === "A"}
            onChange={(e) => onChange({ rating: e.target.checked ? "A" : undefined })}
          />
          <span>
            A-rated only
            <span className="block text-muted-foreground">
              B-rated sponsors are on a Home Office action plan and can&apos;t issue new certificates of sponsorship.
            </span>
          </span>
        </label>
      </Section>
    </div>
  );
}

/** Removable pills summarising the active filters. */
export function ActiveFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (changes: Partial<Filters>) => void;
}) {
  const active = [
    filters.q && { key: "q" as const, label: `“${filters.q}”` },
    filters.location && { key: "location" as const, label: filters.location },
    filters.visa && { key: "visa" as const, label: filters.visa },
    filters.role && { key: "role" as const, label: roleFamily(filters.role)?.label ?? filters.role },
    filters.sector && { key: "sector" as const, label: sectorLabel(filters.sector) },
    filters.rating && { key: "rating" as const, label: "A-rated only" },
    filters.sponsored && { key: "sponsored" as const, label: "Likely sponsorable" },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];

  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {active.map(({ key, label }) => (
        <Chip key={key} selected onClick={() => onChange({ [key]: undefined })} aria-label={`Remove filter ${label}`}>
          {label} <span aria-hidden="true">×</span>
        </Chip>
      ))}
      {active.length > 1 && (
        <button
          type="button"
          className="px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => onChange({ q: undefined, location: undefined, visa: undefined, rating: undefined, sector: undefined, role: undefined, sponsored: undefined })}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
