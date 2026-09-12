import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white shadow-2xs dark:bg-slate-100 dark:text-slate-950",
        secondary: "border-slate-200/80 bg-slate-100/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300",
        destructive: "border-red-200/60 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 font-semibold",
        outline: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
        success: "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold",
        warning: "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400 font-semibold",
        info: "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-400 font-semibold",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
