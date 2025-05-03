"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/90 dark:bg-black/90 backdrop-blur-sm sticky top-0 z-10 border-b-2 border-black dark:border-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Button variant="ghost" size="lg" className="font-bold text-xl">
              SidePal
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/sponsors">
              <Button
                variant={isActive("/sponsors") ? "default" : "ghost"}
                size="default"
              >
                Find Sponsors
              </Button>
            </Link>
            <Link href="/saved">
              <Button
                variant={isActive("/saved") ? "default" : "ghost"}
                size="default"
              >
                Saved
              </Button>
            </Link>
            <Link href="/guide/visa-basics">
              <Button
                variant={isActive("/guide/visa-basics") ? "default" : "ghost"}
                size="default"
              >
                Guide
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
