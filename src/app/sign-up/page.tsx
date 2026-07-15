"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Zap, Eye, EyeOff, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z
  .object({
    name:            z.string().min(2, "Name must be at least 2 characters"),
    email:           z.string().email("Invalid email address"),
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignUpPage() {
  const [showPass, setShowPass]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess]        = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     data.name.trim(),
          email:    data.email.toLowerCase(),
          password: data.password,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }
      setSuccess(true);
    });
  }

  // ── Success / Pending Approval Screen ──────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-10 shadow-2xl text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-400" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Account Created!</h2>
              <p className="text-amber-300/80 font-medium text-sm">
                Awaiting Admin Approval
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                Your account has been registered successfully. A platform administrator
                will review and approve your account. You will be able to sign in
                <strong className="text-white/70"> only after approval</strong>.
              </p>
            </div>

            {/* Steps */}
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
              {[
                { icon: "✅", text: "Account registered" },
                { icon: "⏳", text: "Waiting for admin approval", active: true },
                { icon: "🔓", text: "You can sign in after approval" },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${step.active ? "text-amber-300" : "text-white/40"}`}>
                  <span className="text-base">{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>

            <Link href="/sign-in?registered=true">
              <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white h-11">
                Go to Sign In
              </Button>
            </Link>

            <p className="text-xs text-white/25">
              Once approved, sign in at{" "}
              <span className="text-white/40">/sign-in</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Registration Form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-white/50 text-sm mt-1">Join LinkVault today</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">

          {/* Approval notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              New accounts require <strong>one-time admin approval</strong> before you can sign in.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-950/30 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                autoComplete="name"
                {...register("name")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  {...register("password")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/70">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500 pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" disabled={isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-violet-400 hover:text-violet-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
