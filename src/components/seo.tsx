import Link from "next/link";
import type { Sponsor } from "@/lib/sponsorTypes";
import { sponsorPath } from "@/lib/seo";

/** Visible breadcrumb trail (pair with `breadcrumbs()` JSON-LD). */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i < items.length - 1 ? (
              <Link href={c.path} className="hover:text-foreground">
                {c.name}
              </Link>
            ) : (
              <span className="text-foreground">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Visible questions and answers (pair with `faq()` JSON-LD). */
export function FaqList({ title, entries }: { title: string; entries: { q: string; a: string }[] }) {
  return (
    <section className="mt-12" aria-labelledby="faq">
      <h2 id="faq" className="font-display text-2xl font-semibold">
        {title}
      </h2>
      <dl className="mt-4 divide-y divide-border border-y border-border">
        {entries.map(({ q, a }) => (
          <div key={q} className="py-4">
            <dt className="font-medium">{q}</dt>
            <dd className="mt-1 text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** A crawlable list of sponsors, each linking to its own page. */
export function SponsorList({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {sponsors.map((s) => (
        <li key={s.id}>
          <Link href={sponsorPath(s.id)} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 hover:bg-muted/40 sm:px-2">
            <span className="font-medium">{s.name}</span>
            <span className="text-sm text-muted-foreground">
              {s.location}
              {s.rating && ` · ${s.rating}-rated`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Lead paragraph that answers the page's question directly (what AI search quotes). */
export function Answer({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{children}</p>;
}
