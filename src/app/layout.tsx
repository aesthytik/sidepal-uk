import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "UK Tech-Visa Sponsor Finder",
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
      <body
        className={`${inter.className} min-h-screen bg-gradient-light dark:bg-gradient-dark`}
      >
        <Navigation />
        <div className="pt-4">{children}</div>
      </body>
    </html>
  );
}
