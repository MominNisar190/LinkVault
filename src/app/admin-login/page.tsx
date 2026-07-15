"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:  "Invalid admin credentials.",
  PENDING_APPROVAL:   "This account is not yet approved.",
  ACCOUNT_SUSPENDED:  "This account has been suspended.",
  NOT_ADMIN:          "Access denied. Admin accounts only.",
  default:            "Something went wrong. Please try again.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPass, setShowPass]      = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
        return;
      }

      // Verify the signed-in user is actually an admin
      const res = await fetch("/api/auth/check-admin");
      const json = await res.json();

      if (!json.isAdmin) {
        // Sign them out immediately — not an admin
        await fetch("/api/auth/signout", { method: "POST" });
        setError(ERROR_MESSAGES.NOT_ADMIN);
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg shadow-red-900/30">
            <ShieldCheck className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-white/40 text-sm mt-1">Restricted access — admins only</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">

          {/* Security notice */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <Lock className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300/80 leading-relaxed">
              This portal is for administrators only. Unauthorized access attempts are logged.
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
              <Label htmlFor="email" className="text-white/70">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                {...register("email")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500"
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
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-red-700 hover:bg-red-600 text-white h-11 gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Verifying…" : "Access Admin Panel"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Regular users?{" "}
          <a href="/sign-in" className="text-white/40 hover:text-white/60 underline underline-offset-2">
            Sign in here
          </a>
        </p>
      </motion.div>
    </div>
  );
}
