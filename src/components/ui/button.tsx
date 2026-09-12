import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white",
        primary: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500",
        destructive: "bg-red-600 text-white shadow-xs hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500",
        outline: "border border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50/80 hover:text-slate-950 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
        secondary: "bg-slate-100/90 text-slate-800 border border-slate-200/70 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700/70 dark:hover:bg-slate-700/80 shadow-2xs",
        ghost: "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
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
