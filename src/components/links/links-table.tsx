"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Copy, Edit, Trash2, Archive, MoreHorizontal,
  ExternalLink, CheckCircle2, XCircle, Clock, Eye, BarChart3,
  RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import { useLinks, useDeleteLink, useDuplicateLink, useBulkAction, useUpdateLink } from "@/hooks/use-links";
import { buildShortUrl, copyToClipboard, formatNumber, timeAgo, getDomain, truncate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const STATUS_CONFIG = {
  ACTIVE:   { label: "Active",   color: "success",     icon: CheckCircle2 },
  INACTIVE: { label: "Inactive", color: "warning",     icon: XCircle },
  ARCHIVED: { label: "Archived", color: "secondary",   icon: Archive },
  EXPIRED:  { label: "Expired",  color: "destructive", icon: Clock },
} as const;

export function LinksTable() {
  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [status, setStatus]           = useState<string>("all");
  const [sortBy, setSortBy]           = useState("createdAt");
  const [sortOrder, setSortOrder]     = useState<"asc" | "desc">("desc");
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState<string[]>([]);

  const { data, isLoading, refetch } = useLinks({
    q: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });

  const deleteMutation   = useDeleteLink();
  const duplicateMutation = useDuplicateLink();
  const bulkMutation     = useBulkAction();
  const updateMutation   = useUpdateLink();

  const links      = data?.data?.links ?? [];
  const meta       = data?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => { setDebounced(val); setPage(1); }, 350);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelected(selected.length === links.length ? [] : links.map((l: any) => l.id));
  }

  async function handleCopy(slug: string) {
    await copyToClipboard(buildShortUrl(slug));
    toast({ title: "Copied to clipboard" });
  }

  async function handleBulk(action: string) {
    if (!selected.length) return;
    await bulkMutation.mutateAsync({ ids: selected, action: action as any });
    setSelected([]);
  }

  async function handleToggleStatus(link: any) {
    await updateMutation.mutateAsync({
      id: link.id,
      status: link.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    } as any);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links, slugs, URLs..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
          const [sb, so] = v.split("-");
          setSortBy(sb);
          setSortOrder(so as "asc" | "desc");
        }}>
          <SelectTrigger className="w-44">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="clicks-desc">Most Clicks</SelectItem>
            <SelectItem value="clicks-asc">Least Clicks</SelectItem>
            <SelectItem value="title-asc">Title A–Z</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl"
          >
            <span className="text-sm font-medium">{selected.length} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => handleBulk("enable")}>Enable</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulk("disable")}>Disable</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulk("archive")}>Archive</Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulk("delete")}>
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading links…</div>
        ) : links.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-muted-foreground">No links found</p>
            <Link href="/dashboard/links/new">
              <Button className="mt-4 gap-2" variant="outline">Create your first link</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selected.length === links.length && links.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Link</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Destination</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Clicks</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Created</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {links.map((link: any, i: number) => {
                  const statusCfg = STATUS_CONFIG[link.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.includes(link.id)}
                          onCheckedChange={() => toggleSelect(link.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-primary font-medium">
                              /{link.slug}
                            </span>
                            <button
                              onClick={() => handleCopy(link.slug)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {link.title && (
                            <span className="text-xs text-muted-foreground">{link.title}</span>
                          )}
                          {link.tags?.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {link.tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs py-0 h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground max-w-[200px]">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-xs">{getDomain(link.destinationUrl)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-semibold">{formatNumber(link.totalClicks)}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatNumber(link.uniqueClicks)} uniq)
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant={statusCfg.color as any} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                        {timeAgo(link.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/links/${link.id}`}>
                                <Eye className="h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/links/${link.id}`}>
                                <Edit className="h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/analytics?linkId=${link.id}`}>
                                <BarChart3 className="h-4 w-4" /> Analytics
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(link.id)}>
                              <Copy className="h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(link)}>
                              {link.status === "ACTIVE" ? (
                                <><XCircle className="h-4 w-4" /> Disable</>
                              ) : (
                                <><CheckCircle2 className="h-4 w-4" /> Enable</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteMutation.mutate(link.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {meta.total} links
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
