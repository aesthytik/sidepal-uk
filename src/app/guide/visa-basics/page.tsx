import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "UK work visa basics",
  description: "How sponsored UK work visas work: the main routes, what employers must do, and how to apply.",
};

function Gov({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-muted-foreground [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function VisaBasicsGuidePage() {
  return (
    <main className="container max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">UK work visa basics</h1>
        <p className="mt-2 text-muted-foreground">
          A short overview. Rules and salary thresholds change often, so always check the linked GOV.UK pages before
          you apply.
        </p>
      </header>

      <Section title="The main sponsored routes">
        <div>
          <h3>Skilled Worker</h3>
          <ul>
            <li>The most common route. You need a job offer from a licensed sponsor.</li>
            <li>The role must be an eligible occupation and meet a minimum salary (the general threshold or the occupation&apos;s going rate, whichever is higher).</li>
            <li>You need to prove your English, and the route can lead to settlement.</li>
            <li>
              <Gov href="https://www.gov.uk/skilled-worker-visa">Current Skilled Worker rules on GOV.UK</Gov>
            </li>
          </ul>
        </div>
        <div>
          <h3>Global Business Mobility</h3>
          <ul>
            <li>For people moved to the UK by an overseas employer, e.g. Senior or Specialist Worker, Graduate Trainee.</li>
            <li>Temporary: it does not lead to settlement on its own.</li>
            <li>
              <Gov href="https://www.gov.uk/government/collections/global-business-mobility-visas">Global Business Mobility on GOV.UK</Gov>
            </li>
          </ul>
        </div>
        <div>
          <h3>Scale-up</h3>
          <ul>
            <li>For highly skilled roles at fast-growing companies.</li>
            <li>Sponsorship is only needed for the first 6 months, after which you can change employer.</li>
            <li>
              <Gov href="https://www.gov.uk/scale-up-worker-visa">Scale-up visa on GOV.UK</Gov>
            </li>
          </ul>
        </div>
      </Section>

      <Section title="What a sponsor licence means">
        <ul>
          <li>Only employers on the register can issue a Certificate of Sponsorship (CoS), which you need to apply.</li>
          <li>
            <strong className="text-foreground">A-rated</strong> sponsors are fully trusted.{" "}
            <strong className="text-foreground">B-rated</strong> sponsors are on an action plan and can&apos;t assign
            new certificates until it&apos;s resolved.
          </li>
          <li>A licence means the employer <em>can</em> sponsor, not that every role is open to sponsorship. Check the job ad or ask.</li>
        </ul>
      </Section>

      <Section title="How applying works">
        <ol className="list-decimal space-y-3 pl-5">
          <li><strong className="text-foreground">Find a licensed sponsor</strong> with a role that fits you.</li>
          <li><strong className="text-foreground">Get a job offer</strong>, and the employer assigns you a Certificate of Sponsorship.</li>
          <li><strong className="text-foreground">Prepare documents:</strong> passport, English evidence, and anything else your route requires.</li>
          <li><strong className="text-foreground">Apply online</strong> and pay the fee and Immigration Health Surcharge.</li>
          <li><strong className="text-foreground">Prove your identity</strong> (app or appointment) and wait for a decision.</li>
        </ol>
      </Section>

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <Link href="/sponsors">Find a sponsor</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Not legal advice. See <Gov href="https://www.gov.uk/browse/visas-immigration/work-visas">GOV.UK work visas</Gov>.
        </p>
      </div>
    </main>
  );
}
