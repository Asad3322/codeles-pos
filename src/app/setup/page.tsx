"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Building2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodelesLogo } from "@/components/ui/codeles-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { setupSchema, type SetupInput } from "@/validations/setup.schema";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      bakeryName: "",
      ownerName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: SetupInput) => {
    setError("");

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Setup failed");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to complete setup. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background px-4 py-10 selection:bg-lime-500 selection:text-white">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card className="rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-sm dark:border-slate-800/90 dark:bg-[#0f172a]/95">
          <CardHeader className="pb-6 pt-8 text-center">
            <div className="mb-3 flex justify-center">
              <CodelesLogo size="xl" />
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Set Up Your Bakery
            </CardTitle>

            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Create your bakery profile and owner account to start using Codeles POS.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
              <section className="space-y-4">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Bakery Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    These details will identify your business inside Codeles POS.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bakeryName">Bakery Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="bakeryName"
                      placeholder="e.g. Royal Bakers"
                      className="h-11 pl-9.5"
                      {...register("bakeryName")}
                    />
                  </div>
                  {errors.bakeryName && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.bakeryName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="phone"
                        placeholder="03XX XXXXXXX"
                        className="h-11 pl-9.5"
                        {...register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="address"
                        placeholder="Bakery address"
                        className="h-11 pl-9.5"
                        {...register("address")}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              <section className="space-y-4">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Owner Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This account will have administrator access to the bakery.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="ownerName"
                      placeholder="Your full name"
                      className="h-11 pl-9.5"
                      {...register("ownerName")}
                    />
                  </div>
                  {errors.ownerName && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.ownerName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="owner@example.com"
                      className="h-11 pl-9.5"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        className="h-11 pl-9.5"
                        {...register("password")}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="h-11 pl-9.5"
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="group h-11 w-full bg-slate-900 font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-lime-500 dark:text-slate-950 dark:hover:bg-lime-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up Codeles POS...
                  </>
                ) : (
                  <>
                    Complete Bakery Setup
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Codeles POS · Bakery Management & Point of Sale
        </p>
      </div>
    </div>
  );
}
