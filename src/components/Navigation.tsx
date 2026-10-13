"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useShortlist } from "@/store/useShortlist";
import { MenuIcon, XIcon } from "./ui/icons";
import { HUD } from "./game/HUD";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/sponsors", label: "Find sponsors" },
  { href: "/saved", label: "My shortlist" },
  { href: "/profile", label: "My profile" },
  { href: "/guide/visa-basics", label: "Visa guide" },
];

export function Navigation() {
  const pathname = usePathname();
  const savedCount = useShortlist((s) => Object.keys(s.items).length);
  const [open, setOpen] = useState(false);

  const links = LINKS.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm transition-colors md:border-b-2 md:px-1 md:py-[1.05rem]",
        pathname === href
          ? "font-medium text-foreground md:border-foreground"
          : "text-muted-foreground hover:text-foreground md:border-transparent"
      )}
    >
      {label}
      {href === "/saved" && savedCount > 0 && (
        <span className="rounded bg-muted px-1.5 text-xs leading-5 text-foreground tabular-nums">{savedCount}</span>
      )}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="container flex h-14 max-w-6xl items-center justify-between gap-4 px-4" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/icon.svg" alt="" width={24} height={24} className="rounded-[5px]" />
          Horus
        </Link>
        <div className="hidden items-center gap-6 md:flex">{links}</div>
        <div className="flex items-center gap-1">
          <HUD />
          <button
            type="button"
            className="-mr-2 rounded-md p-2 hover:bg-muted md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <XIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
          </button>
        </div>
      </nav>
      {open && <div className="container flex max-w-6xl flex-col border-t border-border px-4 py-2 md:hidden">{links}</div>}
    </header>
  );
}
