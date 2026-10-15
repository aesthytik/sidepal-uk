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
  { href: "/visa-salary-checker", label: "Salary checker" },
  { href: "/guide/visa-basics", label: "Visa guide" },
];

export function Navigation() {
  const pathname = usePathname();
  const savedCount = useShortlist((s) => Object.keys(s.items).length + Object.keys(s.jobs).length);
  const [open, setOpen] = useState(false);

  const links = LINKS.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
        pathname === href
          ? "bg-foreground/[0.06] text-foreground"
          : "text-foreground/75 hover:text-foreground"
      )}
    >
      {label}
      {href === "/saved" && savedCount > 0 && (
        <span className="rounded-full bg-mint px-1.5 text-xs leading-5 text-foreground tabular-nums">{savedCount}</span>
      )}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <nav className="container flex h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-4" aria-label="Main">
        <Link href="/" aria-label="Horus home" className="flex items-center gap-2.5 font-display text-[1.6rem] tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/icon.svg" alt="" width={36} height={36} className="rounded-[10px]" />
          <span className="hidden min-[400px]:inline">Horus</span>
        </Link>
        <div className="hidden items-center gap-0.5 xl:flex">{links}</div>
        <div className="flex items-center gap-1">
          <HUD />
          <button
            type="button"
            className="-mr-2 rounded-md p-2 hover:bg-muted xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <XIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
          </button>
        </div>
      </nav>
      {open && <div className="container flex max-w-6xl flex-col border-t border-border px-4 py-2 xl:hidden">{links}</div>}
    </header>
  );
}
