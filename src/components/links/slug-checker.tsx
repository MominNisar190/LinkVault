"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface SlugCheckerProps {
  slug: string;
}

export function SlugChecker({ slug }: SlugCheckerProps) {
  const [state, setState] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!slug || slug.length < 2) { setState("idle"); return; }
    setState("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check-slug?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();
        setState(json.data?.available ? "available" : "taken");
      } catch { setState("idle"); }
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  if (state === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs mt-1">
      {state === "checking" && <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Checking…</span></>}
      {state === "available" && <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Slug is available</span></>}
      {state === "taken" && <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Slug is already taken</span></>}
    </div>
  );
}
