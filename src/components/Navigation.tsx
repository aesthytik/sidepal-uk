"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useShortlist } from "@/store/useShortlist";
import { MenuIcon, XIcon } from "./ui/icons";

const LINKS = [
  { href: "/sponsors", label: "Find sponsors" },
  { href: "/saved", label: "My shortlist" },
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
        "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        pathname === href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
      {href === "/saved" && savedCount > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground">{savedCount}</span>
      )}
    </Link>
  ));

  return (
    <header className="sticky top-3 z-30 px-3">
      <nav className="container flex h-14 max-w-5xl items-center justify-between rounded-full border border-border/70 bg-background/80 px-5 shadow-sm backdrop-blur" aria-label="Main">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Side<span className="text-primary">pal</span>
        </Link>
        <div className="hidden items-center gap-1 sm:flex">{links}</div>
        <button
          type="button"
          className="-mr-2 rounded-lg p-2 hover:bg-muted sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <XIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
        </button>
      </nav>
      {open && <div className="container mt-2 flex max-w-5xl flex-col gap-1 rounded-3xl border border-border/70 bg-background p-3 sm:hidden">{links}</div>}
    </header>
  );
}
