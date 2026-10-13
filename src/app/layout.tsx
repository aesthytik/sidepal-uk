import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Fraunces, Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ShortlistHydrator } from "@/components/ShortlistHydrator";
import { GameLayer } from "@/components/game/GameLayer";
import { SecretEye } from "@/components/game/SecretEye";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-fraunces", axes: ["opsz", "SOFT"] });
// Only used by the arcade-mode easter egg, so it isn't preloaded
const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap", preload: false, variable: "--font-pixel" });

const SUPPORT_URL = "https://buymeacoffee.com/aesthytik";

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
    { media: "(prefers-color-scheme: light)", color: "#F6F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#161513" },
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
      <body className={`${inter.variable} ${fraunces.variable} ${pixel.variable} flex min-h-screen flex-col font-sans`}>
        <ShortlistHydrator />
        <GameLayer />
        <Navigation />
        <div className="flex-1">{children}</div>
        <footer className="mt-16 border-t border-border py-14 text-sm text-muted-foreground">
          <div className="container grid max-w-6xl gap-10 px-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div>
              <p className="font-display text-3xl font-semibold text-foreground">Horus</p>
              <p className="mt-3 max-w-sm">
                Find UK employers licensed to sponsor your work visa, see who&apos;s hiring, and track your applications.
              </p>
              <div className="mt-6 max-w-sm rounded-lg border border-border bg-card p-4">
                <p className="text-foreground">Horus is free and independent.</p>
                <p className="mt-1">If it helped your search, you can keep it running with a coffee.</p>
                <a
                  href={SUPPORT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <span aria-hidden="true">☕</span> Buy me a coffee
                </a>
              </div>
              <SecretEye />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Product</p>
              <Link href="/sponsors" className="hover:text-foreground">Find sponsors</Link>
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
              <a className="hover:text-foreground" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                Support Horus
              </a>
            </div>
          </div>
        </footer>
        <Analytics />
        {/* Hotjar tracking for horus.to */}
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:784104,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      </body>
    </html>
  );
}
