import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ShortlistHydrator } from "@/components/ShortlistHydrator";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sidepal.club"),
  title: { default: "Sidepal | Find UK visa sponsor jobs", template: "%s | Sidepal" },
  description:
    "Search every UK employer licensed to sponsor work visas, see their open roles, and track your applications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="icon" href="/globe.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} flex min-h-screen flex-col font-sans`}>
        <ShortlistHydrator />
        <Navigation />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border py-8 text-sm text-muted-foreground">
          <div className="container flex flex-col gap-2 px-4 sm:flex-row sm:justify-between">
            <p>
              Data from the{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
                target="_blank"
                rel="noopener noreferrer"
              >
                GOV.UK register of licensed sponsors
              </a>
              . Not affiliated with the Home Office.
            </p>
            <p>
              <Link href="/guide/visa-basics" className="hover:text-foreground">
                Visa guide
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
