"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Tech Visa Finder
          </Link>

          <div className="flex gap-6">
            <Link
              href="/sponsors"
              className={`${
                isActive("/sponsors")
                  ? "text-accent-blue font-medium"
                  : "hover:text-accent-blue"
              }`}
            >
              Find Sponsors
            </Link>
            <Link
              href="/saved"
              className={`${
                isActive("/saved")
                  ? "text-accent-blue font-medium"
                  : "hover:text-accent-blue"
              }`}
            >
              Saved
            </Link>
            <Link
              href="/guide/visa-basics"
              className={`${
                isActive("/guide/visa-basics")
                  ? "text-accent-blue font-medium"
                  : "hover:text-accent-blue"
              }`}
            >
              Guide
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
