import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "SidePal | UK Tech-Visa Sponsor Finder",
  description:
    "Find UK companies licensed to sponsor Skilled Worker and other tech-friendly visas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/globe.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen bg-gradient-light dark:bg-gradient-dark`}
      >
        <Navigation />
        <div className="pt-4">{children}</div>
      </body>
    </html>
  );
}
