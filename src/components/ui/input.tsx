import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 transition-all duration-150 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500/80 focus-visible:border-lime-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-700 dark:focus-visible:ring-lime-400 dark:focus-visible:border-lime-400",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
