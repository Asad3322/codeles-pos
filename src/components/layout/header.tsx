"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0d1422]/90 lg:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
      </div>

      <div className="relative flex items-center gap-2.5 sm:gap-3.5" ref={dropdownRef}>
        {/* Role Badge */}
        <Badge
          variant="secondary"
          className="capitalize font-semibold text-xs px-2.5 py-1 bg-slate-100/90 text-slate-700 border border-slate-200/80 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700"
        >
          <ShieldCheck className="mr-1 h-3.5 w-3.5 text-lime-600 dark:text-lime-400" />
          {session?.user?.role ?? "guest"}
        </Badge>

        <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-400 md:inline">
          {session?.user?.name}
        </span>

        {/* Dedicated Animated Theme Toggle */}
        <ThemeToggle />

        {/* Profile Avatar Button */}
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:text-lime-400 dark:hover:bg-slate-700 ring-2 ring-transparent focus:ring-lime-500 outline-none"
          aria-label="Open user profile menu"
        >
          {session?.user?.name ? initials : <User className="h-4 w-4" />}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-[#0f172a] animate-in fade-in-50 zoom-in-95">
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800/80">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {session?.user?.email ?? "no-email@pos.local"}
              </p>
            </div>
            <div className="p-1 space-y-0.5">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile Settings
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
