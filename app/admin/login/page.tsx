"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.success) {
        throw new Error("Unable to sign in. Please try again.");
      }

      const redirectTo =
        data.user?.role === "STAFF" ? "/admin/orders" : "/admin/overview";

      window.location.replace(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-5xl space-y-6">
        {/* BRAND */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="size-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              BUN CHHEANG <span className="text-primary">CAFE</span>
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Management Dashboard
            </p>
          </div>
        </div>

        {/* LOGIN CARD */}
        <Card className="overflow-hidden p-0 shadow-xl">
          <CardContent className="grid p-0 md:grid-cols-2">
            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-10">
              <FieldGroup>
                {/* HEADER */}
                <div className="mb-3 flex flex-col items-center gap-2 text-center">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Welcome Back
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Sign in to access your management dashboard.
                  </p>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* EMAIL */}
                <Field>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="username"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={loading}
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </Field>

                {/* PASSWORD */}
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                      required
                      className="h-11 pl-10 pr-11"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </Field>

                {/* SUBMIT */}
                <Field>
                  <Button
                    type="submit"
                    disabled={loading || !email.trim() || !password}
                    className="h-11 w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Field>

                {/* SECURITY INFO */}
                <FieldDescription className="pt-3 text-center">
                  <span className="inline-flex items-center justify-center gap-2">
                    <ShieldCheck className="size-4" />
                    Authorized access only
                  </span>
                </FieldDescription>
              </FieldGroup>
            </form>

            {/* RIGHT IMAGE PANEL */}
            <div className="relative hidden min-h-[540px] overflow-hidden bg-neutral-950 md:block">
              <Image
                src="/image/BC-cafe2.webp"
                alt="BUN CHHEANG CAFE"
                fill
                priority
                sizes="(max-width: 768px) 0px, 50vw"
                className="object-cover opacity-75"
              />
            </div>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            BUN CHHEANG CAFE Management System
          </p>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BUN CHHEANG CAFE. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
