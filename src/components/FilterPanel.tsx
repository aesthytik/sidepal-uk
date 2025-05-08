"use client";

import { useState, useEffect } from "react";
import { useSponsorStore } from "@/store/useSponsorStore";
import { Button } from "@/components/ui/button";

// Sector options (Removed)
// const SECTORS = [
//   { value: "it", label: "IT & Software" },
//   { value: "finance", label: "Finance" },
//   { value: "healthcare", label: "Healthcare" },
//   { value: "education", label: "Education" },
//   { value: "retail", label: "Retail" },
//   { value: "other", label: "Other" },
// ];

// Visa type options
const VISA_TYPES = [
  { value: "Skilled Worker", label: "Skilled Worker" },
  { value: "Global Business Mobility", label: "Global Business Mobility" },
  { value: "Scale-up", label: "Scale-up" },
  { value: "Innovator", label: "Innovator" },
  { value: "Start-up", label: "Start-up" },
];

// Popular regions
const POPULAR_REGIONS = [
  { value: "London", label: "London" },
  { value: "Manchester", label: "Manchester" },
  { value: "Birmingham", label: "Birmingham" },
  { value: "Edinburgh", label: "Edinburgh" },
  { value: "Glasgow", label: "Glasgow" },
  { value: "Cambridge", label: "Cambridge" },
  { value: "Oxford", label: "Oxford" },
  { value: "Bristol", label: "Bristol" },
];

export function FilterPanel() {
  const { filters, setFilters } = useSponsorStore();
  // const [selectedSector, setSelectedSector] = useState<string | undefined>(
  //   filters.sector
  // );
  const [selectedCity, setSelectedCity] = useState<string | undefined>(
    filters.city
  );
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(
    filters.county
  );
  const [selectedVisaType, setSelectedVisaType] = useState<string | undefined>(
    filters.visaType
  );
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(
    filters.region
  );

  // Update filters when selections change
  useEffect(() => {
    setFilters({
      // sector: selectedSector, // Removed
      city: selectedCity,
      county: selectedCounty,
      visaType: selectedVisaType,
      region: selectedRegion,
    });
  }, [
    selectedCity,
    selectedCounty,
    selectedVisaType,
    selectedRegion,
    setFilters,
  ]);

  // Reset all filters
  const resetFilters = () => {
    // setSelectedSector(undefined); // Removed
    setSelectedCity(undefined);
    setSelectedCounty(undefined);
    setSelectedVisaType(undefined);
    setSelectedRegion(undefined);
  };

  return (
    <div className="space-y-6">
      {/* City Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">City</h3>
        <input
          type="text"
          placeholder="Enter city"
          value={selectedCity || ""}
          onChange={(e) => setSelectedCity(e.target.value || undefined)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* County Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">County</h3>
        <input
          type="text"
          placeholder="Enter county"
          value={selectedCounty || ""}
          onChange={(e) => setSelectedCounty(e.target.value || undefined)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Visa Type Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Visa Type</h3>
        <div className="space-y-2">
          {VISA_TYPES.map((visa) => (
            <div key={visa.value} className="flex items-center">
              <input
                id={`visa-${visa.value}`}
                type="radio"
                name="visa"
                value={visa.value}
                checked={selectedVisaType === visa.value}
                onChange={(e) => setSelectedVisaType(e.target.value)}
                className="w-4 h-4 text-primary-500 border-2 border-black focus:ring-primary-500"
              />
              <label
                htmlFor={`visa-${visa.value}`}
                className="ml-2 text-sm font-medium"
              >
                {visa.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Region Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Region</h3>
        <div className="space-y-2">
          {POPULAR_REGIONS.map((region) => (
            <div key={region.value} className="flex items-center">
              <input
                id={`region-${region.value}`}
                type="radio"
                name="region"
                value={region.value}
                checked={selectedRegion === region.value}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-4 h-4 text-primary-500 border-2 border-black focus:ring-primary-500"
              />
              <label
                htmlFor={`region-${region.value}`}
                className="ml-2 text-sm font-medium"
              >
                {region.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Filters Button */}
      {(selectedCity ||
        selectedCounty ||
        selectedVisaType ||
        selectedRegion) && (
        <Button onClick={resetFilters} variant="outline" className="w-full">
          Reset Filters
        </Button>
      )}
    </div>
  );
}
