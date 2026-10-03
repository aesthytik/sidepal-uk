import { cn } from "@/lib/utils";

/** A toggleable filter pill. */
export function Chip({
  selected,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card hover:border-primary/50 hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
