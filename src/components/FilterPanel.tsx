"use client";

import { useEffect, useRef, useState } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Button } from "@/components/ui/button";
import { VISA_CATEGORIES } from "@/lib/sponsorTypes";

// Popular regions
const POPULAR_REGIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Edinburgh",
  "Glasgow",
  "Cambridge",
  "Oxford",
  "Bristol",
  "Reading",
];

/**
 * Text input that commits its value after the user stops typing
 */
function DebouncedInput({
  value,
  onCommit,
  placeholder,
  label,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const [text, setText] = useState(value);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timeout = setTimeout(() => onCommitRef.current(text), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <input
      type="text"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="w-full p-2 text-base border-2 border-black dark:border-white rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:border-primary-500"
    />
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      {[undefined, ...options].map((option) => {
        const id = `${name}-${option ?? "any"}`;
        return (
          <div key={id} className="flex items-center">
            <input
              id={id}
              type="radio"
              name={name}
              checked={value === option}
              onChange={() => onChange(option)}
              className="w-4 h-4 accent-primary-500"
            />
            <label htmlFor={id} className="ml-2 text-sm font-medium cursor-pointer">
              {option ?? "Any"}
            </label>
          </div>
        );
      })}
    </div>
  );
}

export function FilterPanel() {
  const filters = useSponsorStore((s) => s.filters);
  const setFilters = useSponsorStore((s) => s.setFilters);
  const resetFilters = useSponsorStore((s) => s.resetFilters);

  const hasFilters = Boolean(
    filters.city || filters.county || filters.visaType || filters.region || filters.query
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">City</h3>
        <DebouncedInput
          label="City"
          placeholder="e.g. Leeds"
          value={filters.city ?? ""}
          onCommit={(city) => setFilters({ city })}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">County</h3>
        <DebouncedInput
          label="County"
          placeholder="e.g. Kent"
          value={filters.county ?? ""}
          onCommit={(county) => setFilters({ county })}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Visa Type</h3>
        <RadioGroup
          name="visa"
          options={VISA_CATEGORIES}
          value={filters.visaType}
          onChange={(visaType) => setFilters({ visaType })}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Region</h3>
        <RadioGroup
          name="region"
          options={POPULAR_REGIONS}
          value={filters.region}
          onChange={(region) => setFilters({ region })}
        />
      </div>

      {hasFilters && (
        <Button onClick={resetFilters} variant="outline" className="w-full">
          Reset Filters
        </Button>
      )}
    </div>
  );
}
