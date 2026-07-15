"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink, Copy, BarChart3, Edit, Trash2, Archive, MoreHorizontal,
  CheckCircle2, XCircle, Check, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { buildShortUrl, formatNumber, getDomain, timeAgo } from "@/lib/utils";

interface LinkCardProps {
  link: {
    id: string;
    slug: string;
    title: string | null;
    description: string | null;
    destinationUrl: string;
    status: string;
    totalClicks: number;
    uniqueClicks: number;
    tags: string[];
    createdAt: Date;
    project?: { name: string; color: string } | null;
  };
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, status: string) => void;
  onDuplicate?: (id: string) => void;
  index?: number;
}

export function LinkCard({ link, onDelete, onToggleStatus, onDuplicate, index = 0 }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const shortUrl = buildShortUrl(link.slug);

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  }

  const isActive = link.status === "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <Card className="group hover:border-primary/20 transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title + status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/dashboard/links/${link.id}`}
                  className="font-semibold hover:text-primary transition-colors truncate"
                >
                  {link.title ?? `/${link.slug}`}
                </Link>
                <Badge
                  variant={isActive ? "success" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {link.status}
                </Badge>
                {link.project && (
                  <Badge variant="outline" className="shrink-0 text-xs gap-1">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: link.project.color }}
                    />
                    {link.project.name}
                  </Badge>
                )}
              </div>

              {/* Short URL */}
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {shortUrl}
                </code>
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy short URL"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3 shrink-0" />
                <a
                  href={link.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors truncate max-w-xs"
                >
                  {getDomain(link.destinationUrl)}
                </a>
              </div>

              {/* Tags */}
              {link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {link.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right: stats + actions */}
            <div className="flex items-start gap-3 shrink-0">
              {/* Clicks */}
              <div className="text-right hidden sm:block">
                <p className="text-lg font-bold tabular-nums">{formatNumber(link.totalClicks)}</p>
                <p className="text-xs text-muted-foreground">clicks</p>
                <p className="text-xs text-muted-foreground">{timeAgo(link.createdAt)}</p>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/links/${link.id}`}>
                      <BarChart3 className="h-4 w-4" /> Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/links/${link.id}/edit`}>
                      <Edit className="h-4 w-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>
                  </DropdownMenuItem>
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(link.id)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                  )}
                  {onToggleStatus && (
                    <DropdownMenuItem onClick={() => onToggleStatus(link.id, link.status)}>
                      {isActive ? (
                        <><XCircle className="h-4 w-4" /> Disable</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Enable</>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
