"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

export function CopyButton({ text, label, className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleCopy}
      className={cn("gap-2 transition-all", className)}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </Button>
  );
}
