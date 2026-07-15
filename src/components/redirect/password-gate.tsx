"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordGateProps {
  slug: string;
  error?: string;
  ogTitle?: string;
}

export function PasswordGate({ slug, error, ogTitle }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    router.push(`/${slug}?p=${encodeURIComponent(password)}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-4 rounded-full bg-violet-500/20 border border-violet-500/30">
            <Lock className="w-8 h-8 text-violet-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">Password Required</h1>
            {ogTitle && <p className="text-sm text-white/50 mt-1">{ogTitle}</p>}
            <p className="text-sm text-white/40 mt-1">This link is password protected</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? "Checking..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
