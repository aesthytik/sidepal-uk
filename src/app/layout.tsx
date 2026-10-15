import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Source_Serif_4, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ShortlistHydrator } from "@/components/ShortlistHydrator";
import { GameLayer } from "@/components/game/GameLayer";
import { SecretEye } from "@/components/game/SecretEye";
import { Analytics } from "@vercel/analytics/next";
import { CookieBanner, CookieSettingsLink } from "@/components/CookieBanner";
import { JsonLd } from "@/components/JsonLd";
import { SITE, SITE_DESCRIPTION, SITE_TITLE, pageMetadata } from "@/lib/seo";

const body = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const display = Source_Serif_4({ subsets: ["latin"], display: "swap", weight: ["400", "500"], variable: "--font-display" });
// Only used by the arcade-mode easter egg, so it isn't preloaded
const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap", preload: false, variable: "--font-pixel" });

const SUPPORT_URL = "https://buymeacoffee.com/aesthytik";

const defaults = pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${SITE_TITLE} | Horus`, template: "%s | Horus" },
  description: SITE_DESCRIPTION,
  applicationName: "Horus",
  openGraph: defaults.openGraph,
  twitter: defaults.twitter,
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  robots: { index: true, follow: true, googleBot: { "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCFC" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* Lets CSS hide scroll-reveal content only when JS is there to reveal it again */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE}/#organization`,
            name: "Horus",
            url: SITE,
            logo: `${SITE}/icon.svg`,
            description: SITE_DESCRIPTION,
          }}
        />
      </head>
      <body className={`${body.variable} ${display.variable} ${pixel.variable} flex min-h-screen flex-col font-sans`}>
        <ShortlistHydrator />
        <GameLayer />
        <Navigation />
        <div className="flex-1">{children}</div>
        <footer className="mt-16 bg-muted py-16 text-sm text-muted-foreground">
          <div className="container grid max-w-6xl gap-10 px-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <p className="font-display text-4xl text-foreground">Horus</p>
              <p className="mt-3 max-w-sm">
                Find UK employers licensed to sponsor your work visa, see who&apos;s hiring, and track your applications.
              </p>
              <div className="mt-6 max-w-sm rounded-lg bg-card p-5 shadow-card">
                <p className="text-foreground">Horus is free and independent.</p>
                <p className="mt-1">If it helped your search, you can keep it running with a coffee.</p>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background hover:bg-foreground/85"
                >
                  <span aria-hidden="true">☕</span> Buy me a coffee
                </a>
              </div>
              <SecretEye />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Product</p>
              <Link href="/sponsors" className="hover:text-foreground">Find sponsors</Link>
              <Link href="/jobs" className="hover:text-foreground">Browse jobs</Link>
              <Link href="/saved" className="hover:text-foreground">My shortlist</Link>
              <Link href="/guide/visa-basics" className="hover:text-foreground">Visa guide</Link>
              <Link href="/visa-salary-checker" className="hover:text-foreground">Visa salary checker</Link>
              <Link href="/visa-sponsors" className="hover:text-foreground">Sponsors by place</Link>
              <Link href="/visa-sponsorship-jobs" className="hover:text-foreground">Jobs by role</Link>
              <Link href="/visa-routes" className="hover:text-foreground">Visa routes</Link>
              <Link href="/about" className="hover:text-foreground">About the data</Link>
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
              <CookieSettingsLink />
              <a className="hover:text-foreground" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Support Horus
              </a>
            </div>
          </div>
        </footer>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
