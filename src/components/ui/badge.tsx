import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      primary: "bg-accent text-accent-foreground",
      success: "bg-sage/10 text-sage",
      warning: "bg-gold/10 text-gold",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
