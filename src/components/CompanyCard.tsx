"use client";

import { Sponsor } from "@/lib/sponsorTypes";
import { Button } from "@/components/ui/button";
import { useSponsorStore } from "@/store/useSponsorStore";

interface CompanyCardProps {
  sponsor: Sponsor;
}

export function CompanyCard({ sponsor }: CompanyCardProps) {
  const { savedSponsors, toggleSaved } = useSponsorStore();
  const isSaved = savedSponsors.has(sponsor.id);

  return (
    <div className="card p-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">{sponsor.name}</h3>
          <p className="text-gray-600 dark:text-gray-400">{sponsor.region}</p>
        </div>
        <button
          onClick={() => toggleSaved(sponsor.id)}
          className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-500"
          aria-label={isSaved ? "Remove from saved" : "Save company"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isSaved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Sector Tag */}
        {sponsor.sector && (
          <span className="bg-secondary-500 text-white text-xs px-2.5 py-1 rounded-full">
            {sponsor.sector.toUpperCase()}
          </span>
        )}

        {/* Visa Type Tags */}
        {sponsor.visaTypes.map((type) => (
          <span
            key={type}
            className="bg-highlight-500 text-gray-900 text-xs px-2.5 py-1 rounded-full"
          >
            {type}
          </span>
        ))}

        {/* Rating Tag */}
        {sponsor.rating && (
          <span className="bg-success-500 text-white text-xs px-2.5 py-1 rounded-full">
            Rating {sponsor.rating}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Website Button */}
        {sponsor.website && (
          <Button asChild variant="outline" size="sm">
            <a
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              Website
            </a>
          </Button>
        )}

        {/* Careers Button */}
        {sponsor.careerUrl ? (
          <Button asChild variant="default" size="sm">
            <a
              href={sponsor.careerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                />
              </svg>
              Careers
            </a>
          </Button>
        ) : (
          sponsor.website && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
            >
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${sponsor.name} careers jobs`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                Search Google
              </a>
            </Button>
          )
        )}
      </div>
    </div>
  );
}
