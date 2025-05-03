"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/90 dark:bg-black/90 backdrop-blur-sm sticky top-0 z-10 border-b-2 border-black dark:border-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-bold text-xl font-display neo-button bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            SidePal
          </Link>

          <div className="flex gap-4">
            <Link
              href="/sponsors"
              className={`${
                isActive("/sponsors")
                  ? "neo-button bg-primary-500 text-white"
                  : "neo-button bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              Find Sponsors
            </Link>
            <Link
              href="/saved"
              className={`${
                isActive("/saved")
                  ? "neo-button bg-primary-500 text-white"
                  : "neo-button bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              Saved
            </Link>
            <Link
              href="/guide/visa-basics"
              className={`${
                isActive("/guide/visa-basics")
                  ? "neo-button bg-primary-500 text-white"
                  : "neo-button bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
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
