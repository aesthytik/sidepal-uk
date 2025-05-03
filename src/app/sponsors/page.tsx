export default function SponsorsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl">UK Tech Visa Sponsors</h1>
        {/* SearchBar component will be added here */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            {/* FilterPanel component will be added here */}
            <div className="card p-4">
              <h2 className="font-bold mb-4">Filters</h2>
              {/* Filter controls will be added here */}
            </div>
          </aside>
          <section className="lg:col-span-9">
            {/* ResultsList component will be added here */}
            <div className="card p-4">
              <h2 className="font-bold mb-4">Results</h2>
              {/* Results will be displayed here */}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
