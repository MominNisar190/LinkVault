import Link from "next/link";
import { Clock, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkExpiredProps {
  reason?: "expired" | "click-limit";
}

export function LinkExpired({ reason = "expired" }: LinkExpiredProps) {
  const isClickLimit = reason === "click-limit";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="p-4 rounded-full bg-red-500/20 border border-red-500/30 inline-flex mx-auto">
          {isClickLimit ? (
            <MousePointerClick className="w-8 h-8 text-red-400" />
          ) : (
            <Clock className="w-8 h-8 text-red-400" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">
            {isClickLimit ? "Link Limit Reached" : "Link Expired"}
          </h1>
          <p className="text-sm text-white/50 mt-2">
            {isClickLimit
              ? "This link has reached its maximum number of clicks."
              : "This link has expired and is no longer active."}
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
