"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  // Prevent layout shift / mismatch before client mount
  if (!mounted) {
    return (
      <div
        className={cn(
          "relative inline-flex h-8 w-15 items-center rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900",
          className
        )}
        aria-hidden="true"
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-xs dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTheme();
        }
      }}
      className={cn(
        "group relative inline-flex h-8 w-15 shrink-0 cursor-pointer items-center rounded-full border p-0.75 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 select-none",
        isDark
          ? "border-slate-700/80 bg-[#0d1422] shadow-inner"
          : "border-slate-200/90 bg-slate-100/90 shadow-2xs hover:bg-slate-200/70",
        className
      )}
    >
      {/* Background Icons (Sun on Left, Moon on Right) */}
      <div className="absolute inset-0 flex items-center justify-between px-1.75 pointer-events-none">
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-all duration-200",
            isDark
              ? "text-slate-500 opacity-40 scale-90"
              : "text-amber-500 opacity-100 scale-100"
          )}
        />
        <Moon
          className={cn(
            "h-3.5 w-3.5 transition-all duration-200",
            isDark
              ? "text-lime-400 opacity-100 scale-100"
              : "text-slate-400 opacity-40 scale-90"
          )}
        />
      </div>

      {/* Sliding Thumb */}
      <span
        className={cn(
          "pointer-events-none relative flex h-6 w-6 items-center justify-center rounded-full shadow-xs transition-transform duration-200 ease-out transform",
          isDark
            ? "translate-x-7 bg-[#1e293b] border border-slate-600/80 text-lime-400 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            : "translate-x-0 bg-white border border-slate-200/80 text-amber-500 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        )}
      >
        {isDark ? (
          <Moon className="h-3.25 w-3.25 fill-current text-lime-400" />
        ) : (
          <Sun className="h-3.25 w-3.25 fill-current text-amber-500" />
        )}
      </span>
    </button>
  );
}
