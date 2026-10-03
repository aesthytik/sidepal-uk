"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onSearch,
  placeholder = "Search company name, city, or county...",
}: SearchBarProps) {
  const [query, setQuery] = useState(value);
  const lastSent = useRef(value);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Reflect external changes (e.g. filters loaded from the URL or reset)
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setQuery(value);
    }
  }, [value]);

  // Debounce the search query to avoid excessive API calls
  useEffect(() => {
    if (query === lastSent.current) return;
    const timeout = setTimeout(() => {
      lastSent.current = query;
      onSearchRef.current(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          aria-label="Search sponsors"
          className="block w-full p-4 pl-10 pr-10 text-sm border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] focus:outline-none focus:ring-0 focus:border-primary-500 bg-white dark:bg-gray-900 [&::-webkit-search-cancel-button]:hidden"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => {
              setQuery("");
              lastSent.current = "";
              onSearchRef.current("");
            }}
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
