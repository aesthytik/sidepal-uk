import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Onest, Press_Start_2P } from "next/font/google";
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
const display = Onest({ subsets: ["latin"], display: "swap", weight: ["500"], variable: "--font-display" });
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
  themeColor: "#FFFFFF",
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
        <footer className="mt-16 overflow-hidden bg-primary pt-16 text-sm text-white">
          <div className="container grid max-w-6xl gap-10 px-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
              <img src="/icon.svg" alt="" width={72} height={72} className="rounded-2xl" />
              <p className="mt-5 max-w-sm text-white/85">
                Find UK employers licensed to sponsor your work visa, see who&apos;s hiring, and track your applications.
              </p>
              <div className="mt-6 max-w-sm rounded-[15px] bg-white/10 p-5">
                <p className="font-medium">Horus is free and independent.</p>
                <p className="mt-1 text-white/85">If it helped your search, you can keep it running with a coffee.</p>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-[11px] bg-white px-4 text-sm font-medium text-primary hover:bg-lime"
                >
                  <span aria-hidden="true">☕</span> Buy me a coffee
                </a>
              </div>
              <SecretEye />
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary-foreground">Product</p>
              <Link href="/sponsors" className="hover:underline">Find sponsors</Link>
              <Link href="/jobs" className="hover:underline">Browse jobs</Link>
              <Link href="/saved" className="hover:underline">My shortlist</Link>
              <Link href="/guide/visa-basics" className="hover:underline">Visa guide</Link>
              <Link href="/visa-salary-checker" className="hover:underline">Visa salary checker</Link>
              <Link href="/visa-sponsors" className="hover:underline">Sponsors by place</Link>
              <Link href="/visa-sponsorship-jobs" className="hover:underline">Jobs by role</Link>
              <Link href="/visa-routes" className="hover:underline">Visa routes</Link>
              <Link href="/about" className="hover:underline">About the data</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary-foreground">Data</p>
              <a
                className="hover:underline"
                href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
                target="_blank"
                rel="noopener noreferrer"
              >
                GOV.UK sponsor register
              </a>
              <p className="text-white/85">Not affiliated with the Home Office.</p>
              <CookieSettingsLink />
              <a className="hover:underline" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Support Horus
              </a>
            </div>
          </div>
          {/* Giant wordmark, cropped by the bottom edge */}
          <p
            aria-hidden="true"
            className="mt-14 select-none whitespace-nowrap text-center font-display text-[28vw] leading-[0.72] tracking-[-0.04em] text-forest-deep"
          >
            Horus
          </p>
        </footer>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
