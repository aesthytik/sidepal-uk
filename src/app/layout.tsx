import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ShortlistHydrator } from "@/components/ShortlistHydrator";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });

const DESCRIPTION =
  "Search every UK employer licensed to sponsor work visas, browse live jobs from them, check whether a role is likely sponsorable, and track your applications. Built on the official Home Office register.";

export const metadata: Metadata = {
  metadataBase: new URL("https://horus.to"),
  title: { default: "Horus | Find UK visa sponsor jobs", template: "%s | Horus" },
  description: DESCRIPTION,
  applicationName: "Horus",
  keywords: [
    "UK visa sponsorship jobs",
    "Skilled Worker visa jobs",
    "licensed sponsors register",
    "Home Office sponsor list",
    "jobs that sponsor visas UK",
    "Certificate of Sponsorship",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Horus",
    locale: "en_GB",
    url: "/",
    title: "Horus | Find UK visa sponsor jobs",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "Horus | Find UK visa sponsor jobs", description: DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Horus",
              url: "https://horus.to",
              logo: "https://horus.to/icon.svg",
              description: DESCRIPTION,
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} flex min-h-screen flex-col font-sans`}>
        <ShortlistHydrator />
        <Navigation />
        <div className="flex-1">{children}</div>
        <footer className="mt-16 border-t border-border bg-accent/40 py-14 text-sm text-muted-foreground">
          <div className="container grid gap-10 px-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                Hor<span className="text-primary">us</span>
              </p>
              <p className="mt-3 max-w-sm">
                Find UK employers licensed to sponsor your work visa, see who&apos;s hiring, and track your applications.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Product</p>
              <Link href="/sponsors" className="hover:text-foreground">Find sponsors</Link>
              <Link href="/saved" className="hover:text-foreground">My shortlist</Link>
              <Link href="/guide/visa-basics" className="hover:text-foreground">Visa guide</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Data</p>
              <a
                className="hover:text-foreground"
                href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
                target="_blank"
                rel="noopener noreferrer"
              >
                GOV.UK sponsor register
              </a>
              <p>Not affiliated with the Home Office.</p>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
