"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchIcon, XIcon } from "./ui/icons";

/**
 * A search input that reports its value after the user pauses typing.
 * Follows `value` when it changes from outside (URL navigation, reset).
 */
export function SearchBar({
  value,
  onSearch,
  placeholder = "Search by company name, e.g. Monzo",
  label = "Search sponsors",
  icon = <SearchIcon width={18} height={18} />,
  list,
  className,
  delay = 300,
  onTextChange,
}: {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  list?: string;
  className?: string;
  delay?: number;
  onTextChange?: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  const lastSent = useRef(value);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (text === lastSent.current) return;
    const timeout = setTimeout(() => {
      lastSent.current = text;
      onSearchRef.current(text);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  const send = (next: string) => {
    lastSent.current = next;
    setText(next);
    onSearchRef.current(next);
  };

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{icon}</span>
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        list={list}
        onChange={(e) => {
          setText(e.target.value);
          onTextChange?.(e.target.value);
        }}
        onKeyDown={(e) => e.key === "Enter" && send(text)}
        className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-10 text-base shadow-sm placeholder:text-muted-foreground/80 focus:border-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => send("")}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
