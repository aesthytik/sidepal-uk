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
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-button"
          : "border-input bg-card hover:border-primary hover:bg-accent",
        className
      )}
      {...props}
    />
  );
}
