"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodelesLogo } from "@/components/ui/codeles-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { loginSchema, type LoginInput } from "@/validations/auth.schema";
import { getDefaultRouteForRole } from "@/lib/permissions";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitCallbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role as UserRole | undefined;
    const defaultRoute = getDefaultRouteForRole(role);
    const target =
      explicitCallbackUrl && explicitCallbackUrl !== "/dashboard"
        ? explicitCallbackUrl
        : defaultRoute;

    router.push(target);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 selection:bg-lime-500 selection:text-white">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-sm dark:border-slate-800/90 dark:bg-[#0f172a]/95 rounded-2xl">
          <CardHeader className="text-center pt-8 pb-6">
            <div className="flex justify-center mb-3">
              <CodelesLogo size="xl" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Terminal Sign In
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Point of Sale & Business Management
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@pos.local"
                    className="pl-9.5 h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-lime-500 dark:bg-slate-900 dark:border-slate-800"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-lime-400 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9.5 h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-lime-500 dark:bg-slate-900 dark:border-slate-800"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-center text-xs font-semibold text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold dark:bg-lime-500 dark:text-slate-950 dark:hover:bg-lime-400 transition-all shadow-sm group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Terminal
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Codeles POS &middot; Pakistan Regional Edition (PKR)
        </p>
      </div>
    </div>
  );
}
