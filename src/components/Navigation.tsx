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
  { href: "/visa-salary-checker", label: "Salary checker" },
  { href: "/guide/visa-basics", label: "Visa guide" },
  { href: "/profile", label: "My profile" },
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
        "flex items-center gap-2 rounded-lg px-3 py-2 font-display text-[16px] font-medium tracking-[-0.01em] transition-colors",
        pathname === href ? "text-primary underline decoration-2 underline-offset-[10px]" : "text-foreground hover:text-primary"
      )}
    >
      {label}
    </Link>
  ));

  const actions = (
    <>
      <Link
        href="/sponsors"
        onClick={() => setOpen(false)}
        className="inline-flex h-10 items-center rounded-[11px] border-[0.625px] border-primary bg-primary px-4 font-display text-[15px] font-medium text-primary-foreground hover:bg-forest-deep"
      >
        Find sponsors
      </Link>
      <Link
        href="/saved"
        onClick={() => setOpen(false)}
        className="inline-flex h-10 items-center gap-2 rounded-[11px] border-[0.625px] border-primary px-4 font-display text-[15px] font-medium text-primary hover:bg-accent"
      >
        My shortlist
        {savedCount > 0 && <span className="rounded-full bg-green-dot px-1.5 text-xs leading-5 text-primary tabular-nums">{savedCount}</span>}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 bg-white">
      <nav className="container flex h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-4" aria-label="Main">
        <Link href="/" aria-label="Horus home" className="flex items-center gap-2.5 font-display text-[1.65rem] font-medium tracking-[-0.03em]">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
          <img src="/icon.svg" alt="" width={36} height={36} className="rounded-[10px]" />
          <span className="hidden min-[400px]:inline">Horus</span>
        </Link>
        <div className="hidden items-center gap-0.5 xl:flex">{links}</div>
        <div className="flex items-center gap-2">
          <HUD />
          <div className="hidden items-center gap-2 xl:flex">{actions}</div>
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
      {open && (
        <div className="container flex max-w-6xl flex-col gap-1 border-t border-border px-4 py-3 xl:hidden">
          {links}
          <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
        </div>
      )}
    </header>
  );
}
