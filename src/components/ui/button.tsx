import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "./icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-[11px] font-display text-base font-medium tracking-[-0.01em] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-[0.625px] border-primary bg-primary text-primary-foreground hover:bg-forest-deep",
        outline: "border-[0.625px] border-primary bg-transparent text-primary hover:bg-accent",
        ghost: "text-foreground hover:bg-muted",
        subtle: "bg-accent text-accent-foreground hover:bg-accent/70",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-3 text-sm",
        lg: "h-[51px] px-[30px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

/** The little rounded arrow that sits inside a main call to action. */
function ArrowChip() {
  return (
    <span aria-hidden="true" className="-mr-3 inline-flex size-6 items-center justify-center rounded-[7px] bg-white/15 [&_svg]:!size-3">
      <ArrowRightIcon />
    </span>
  );
}

export { ArrowChip, Button, buttonVariants };
