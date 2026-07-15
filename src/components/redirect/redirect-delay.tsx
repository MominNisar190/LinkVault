"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface RedirectDelayProps {
  destination: string;
  delay: number; // seconds
}

export function RedirectDelay({ destination, delay }: RedirectDelayProps) {
  const [remaining, setRemaining] = useState(delay);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = destination;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [destination]);

  const progress = ((delay - remaining) / delay) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="p-4 rounded-full bg-violet-500/20 border border-violet-500/30 inline-flex mx-auto">
          <ExternalLink className="w-8 h-8 text-violet-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Redirecting in {remaining}s</h1>
          <p className="text-sm text-white/50 mt-2 break-all">{destination}</p>
        </div>

        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <a
          href={destination}
          className="text-sm text-violet-400 underline underline-offset-2 hover:text-violet-300"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  );
}
