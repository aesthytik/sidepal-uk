export default function VisaBasicsGuidePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
        <h1 className="font-display mb-8">UK Tech Visa Basics</h1>

        <section className="card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Understanding UK Work Visas
          </h2>
          <p className="mb-4">
            The UK offers several visa routes for tech professionals looking to
            work in the country. The most common is the Skilled Worker visa,
            which requires sponsorship from a licensed employer.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            Skilled Worker Visa
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Requires a job offer from a licensed sponsor</li>
            <li>Must meet minimum salary requirements</li>
            <li>Position must meet skill level requirements</li>
            <li>English language proficiency required</li>
            <li>Can lead to settlement after 5 years</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Scale-up Visa</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>For high-growth companies</li>
            <li>More flexible than Skilled Worker visa</li>
            <li>Only need sponsorship for first 6 months</li>
            <li>Can change employers without new visa</li>
            <li>Requires higher salary threshold</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            Global Business Mobility
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>For overseas businesses establishing UK presence</li>
            <li>Multiple categories available</li>
            <li>Temporary route - does not lead to settlement</li>
            <li>Different requirements for each category</li>
          </ul>
        </section>

        <section className="card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Eligibility Requirements</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            Skilled Worker Visa
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Job must be at RQF Level 3 or above</li>
            <li>Minimum salary of £26,200 (or going rate for occupation)</li>
            <li>B1 level English language ability</li>
            <li>Must have enough money to support yourself</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Scale-up Visa</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Minimum salary of £33,000</li>
            <li>Job must be at RQF Level 6 or above</li>
            <li>Employer must meet Scale-up criteria</li>
            <li>B1 level English language ability</li>
          </ul>
        </section>

        <section className="card p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Application Process</h2>

          <ol className="list-decimal pl-6 mb-4 space-y-4">
            <li>
              <strong>Find a licensed sponsor</strong>
              <p>
                Use our directory to find companies that can sponsor your visa
              </p>
            </li>
            <li>
              <strong>Receive job offer & Certificate of Sponsorship</strong>
              <p>
                Your employer will assign you a Certificate of Sponsorship (CoS)
              </p>
            </li>
            <li>
              <strong>Prepare documents</strong>
              <p>Including passport, qualifications, and financial evidence</p>
            </li>
            <li>
              <strong>Apply online</strong>
              <p>Submit application and pay relevant fees</p>
            </li>
            <li>
              <strong>Biometrics and decision</strong>
              <p>Attend appointment and await decision (usually 3 weeks)</p>
            </li>
          </ol>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <p className="mb-4">
            Ready to start your UK tech journey? Use our directory to find
            licensed sponsors in your field and begin your application process.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Note: This guide is for informational purposes only. For the most
            up-to-date information, always refer to the official{" "}
            <a
              href="https://www.gov.uk/browse/visas-immigration/work-visas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              UK government website
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
