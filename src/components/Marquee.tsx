export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={hidden || undefined}>
      {items.map((name) => (
        <li key={name} className="whitespace-nowrap font-display text-xl font-semibold text-muted-foreground/70">
          {name}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
