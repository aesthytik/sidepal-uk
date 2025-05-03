import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="mb-6 text-balance font-display inline-block border-2 border-black dark:border-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <span className="text-primary-500">SidePal:</span> Find your UK
              tech sponsor in seconds.
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mb-8 text-gray-700 dark:text-gray-300 font-display">
              Search 130,000+ licensed sponsors, filter by sector, and apply
              directly. No fluff. Just the data you need for your UK tech visa
              journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="default">
                <Link href="/sponsors" className="flex items-center">
                  Browse Sponsors
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/guide/visa-basics">Learn About Visas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-16 font-display inline-block border-2 border-black dark:border-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            Unlock UK Tech Opportunities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-6 flex flex-col items-center text-center border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-16 h-16 mb-4 flex items-center justify-center border-2 border-black dark:border-white bg-primary-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-display border-b-2 border-black dark:border-white pb-1">
                Instant Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-display">
                Find companies licensed to sponsor tech visas in seconds with
                our powerful search tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-6 flex flex-col items-center text-center border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-16 h-16 mb-4 flex items-center justify-center border-2 border-black dark:border-white bg-secondary-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-display border-b-2 border-black dark:border-white pb-1">
                Verified Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-display">
                All sponsor information is AI-verified and regularly updated
                with official UK government data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-6 flex flex-col items-center text-center border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <div className="w-16 h-16 mb-4 flex items-center justify-center border-2 border-black dark:border-white bg-accent-500 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="mb-2 font-display border-b-2 border-black dark:border-white pb-1">
                Direct Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-display">
                Apply directly to companies with verified career pages and
                contact information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900">
              <span className="text-5xl font-bold text-primary-500 mb-2">
                130K+
              </span>
              <span className="text-gray-600 dark:text-gray-400 font-display">
                Licensed Sponsors
              </span>
            </div>
            <div className="flex flex-col items-center p-6 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900">
              <span className="text-5xl font-bold text-primary-500 mb-2">
                15K+
              </span>
              <span className="text-gray-600 dark:text-gray-400 font-display">
                Tech Companies
              </span>
            </div>
            <div className="flex flex-col items-center p-6 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-gray-900">
              <span className="text-5xl font-bold text-primary-500 mb-2">
                24/7
              </span>
              <span className="text-gray-600 dark:text-gray-400 font-display">
                Updated Data
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500 text-white border-y-2 border-black dark:border-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 font-display inline-block border-2 border-white px-4 py-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]">
            Ready to find your UK tech sponsor with SidePal?
          </h2>
          <p className="text-xl max-w-2xl mx-auto mb-8 font-display">
            Start your UK tech visa journey today with the most comprehensive
            sponsor database.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-primary-500 hover:bg-gray-100 border-white"
          >
            <Link href="/sponsors">Search Sponsors Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-gray-900 border-t-2 border-black dark:border-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 font-display">
            © {new Date().getFullYear()} SidePal. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
