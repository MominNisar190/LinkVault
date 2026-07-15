"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Eye, EyeOff, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function SignInPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard";
  const justRegistered = searchParams.get("registered") === "true";

  const [showPass, setShowPass]      = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // show the pending-approval screen when user tries to sign in but is still pending
  const [showPendingScreen, setShowPendingScreen] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email:    data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error === "PENDING_APPROVAL") {
        // Show dedicated pending screen instead of inline error
        setShowPendingScreen(true);
        return;
      }

      if (result?.error === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Please contact support.");
        return;
      }

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  // ── Pending Approval Screen ─────────────────────────────────────────────────
  if (showPendingScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-10 shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Approval Pending</h2>
              <p className="text-amber-300/80 font-medium text-sm">Your account is awaiting admin review</p>
              <p className="text-white/50 text-sm leading-relaxed">
                You registered successfully, but an administrator must approve your account
                before you can sign in. This is a <strong className="text-white/70">one-time check</strong>.
                Once approved, you can log in normally.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
              {[
                { icon: "✅", text: "Account created", done: true },
                { icon: "⏳", text: "Admin approval — in progress", active: true },
                { icon: "🔓", text: "Sign in — available after approval" },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${
                  step.active ? "text-amber-300 font-medium" :
                  step.done   ? "text-emerald-400" : "text-white/30"
                }`}>
                  <span className="text-base">{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              onClick={() => setShowPendingScreen(false)}
            >
              Back to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Sign In Form ────────────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to LinkVault</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">

          {/* Banner shown after registration redirect */}
          <AnimatePresence>
            {justRegistered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Your account is registered. You can sign in <strong>after admin approves</strong> your account.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-950/30 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <Button type="submit" disabled={isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-violet-400 hover:text-violet-300 font-medium">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
