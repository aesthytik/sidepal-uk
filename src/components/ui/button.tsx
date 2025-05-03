import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all font-display border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 font-semibold",
        destructive: "bg-red-500 text-white hover:bg-red-600 font-semibold",
        outline: "bg-background hover:bg-accent/10 font-semibold",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-600 font-semibold",
        ghost:
          "border-0 shadow-none hover:bg-accent/10 hover:translate-x-0 hover:translate-y-0 font-medium",
        link: "border-0 shadow-none underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0 font-medium",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
