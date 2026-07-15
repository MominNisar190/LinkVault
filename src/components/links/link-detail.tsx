"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy, ExternalLink, Edit2, Trash2, Clock, MousePointerClick,
  Globe, BarChart3, History, ArrowLeft, Check, Loader2, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateLink, useDeleteLink, useLinkAnalytics, useLinkHistory, useRestoreHistory } from "@/hooks/use-links";
import { updateLinkSchema, type UpdateLinkInput } from "@/lib/validations";
import { buildShortUrl, copyToClipboard, formatDate, formatNumber, timeAgo, getDomain } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { AnalyticsMini } from "@/components/analytics/analytics-mini";

interface LinkDetailProps {
  link: {
    id: string;
    slug: string;
    destinationUrl: string;
    title: string | null;
    description: string | null;
    status: string;
    totalClicks: number;
    uniqueClicks: number;
    maxClicks: number | null;
    expiresAt: Date | null;
    redirectDelay: number;
    tags: string[];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: { id: string; name: string; color: string } | null;
    history: {
      id: string;
      oldUrl: string;
      newUrl: string;
      changeNote: string | null;
      createdAt: Date;
    }[];
  };
}

export function LinkDetail({ link }: LinkDetailProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const shortUrl = buildShortUrl(link.slug);

  const updateMutation  = useUpdateLink();
  const deleteMutation  = useDeleteLink();
  const restoreMutation = useRestoreHistory();
  const { data: analyticsData } = useLinkAnalytics(link.id);
  const { data: historyData, refetch: refetchHistory } = useLinkHistory(link.id);

  const analytics = (analyticsData as any)?.data;
  const history   = (historyData as any)?.data ?? link.history;

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<UpdateLinkInput>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: {
      id: link.id,
      destinationUrl: link.destinationUrl,
      title: link.title ?? "",
      description: link.description ?? "",
      notes: link.notes ?? "",
    },
  });

  async function handleCopy() {
    await copyToClipboard(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  }

  async function onSubmit(data: UpdateLinkInput) {
    await updateMutation.mutateAsync({ ...data } as any);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    await deleteMutation.mutateAsync(link.id);
    router.push("/dashboard/links");
  }

  async function handleRestore(historyId: string) {
    await restoreMutation.mutateAsync({ linkId: link.id, historyId });
    refetchHistory();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/dashboard/links" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Links
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{link.title ?? `/${link.slug}`}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Created {formatDate(link.createdAt)}
            {link.project && (
              <> · <span style={{ color: link.project.color }}>{link.project.name}</span></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-2">
            <Edit2 className="h-4 w-4" /> {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Short URL card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Short URL</p>
              <p className="font-mono text-lg font-bold text-primary">{shortUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks",   value: formatNumber(link.totalClicks),  icon: MousePointerClick, color: "text-blue-400" },
          { label: "Unique Visitors",value: formatNumber(link.uniqueClicks), icon: Globe,              color: "text-violet-400" },
          { label: "Max Clicks",     value: link.maxClicks ? formatNumber(link.maxClicks) : "∞", icon: MousePointerClick, color: "text-amber-400" },
          { label: "Expires",        value: link.expiresAt ? formatDate(link.expiresAt) : "Never", icon: Clock, color: "text-emerald-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-semibold text-sm">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details"><Edit2 className="h-4 w-4 mr-2" />Details</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />History</TabsTrigger>
        </TabsList>

        {/* ── Details ── */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register("id")} />
                  <div className="space-y-2">
                    <Label>Destination URL</Label>
                    <Input {...register("destinationUrl")} className={errors.destinationUrl ? "border-destructive" : ""} />
                    {errors.destinationUrl && <p className="text-xs text-destructive">{errors.destinationUrl.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input {...register("title")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Change Note</Label>
                      <Input {...register("changeNote")} placeholder="Why did you change this?" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input {...register("description")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Input {...register("notes")} />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={updateMutation.isPending || !isDirty} className="gap-2">
                      {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <Row label="Destination URL">
                    <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm break-all">
                      {link.destinationUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </Row>
                  <Row label="Slug"><code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">/{link.slug}</code></Row>
                  <Row label="Status">
                    <Badge variant={link.status === "ACTIVE" ? "success" : "secondary"}>{link.status}</Badge>
                  </Row>
                  {link.description && <Row label="Description"><p className="text-sm">{link.description}</p></Row>}
                  {link.notes && <Row label="Notes"><p className="text-sm text-muted-foreground">{link.notes}</p></Row>}
                  {link.tags.length > 0 && (
                    <Row label="Tags">
                      <div className="flex gap-1.5 flex-wrap">
                        {link.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                      </div>
                    </Row>
                  )}
                  {link.redirectDelay > 0 && (
                    <Row label="Redirect Delay"><span className="text-sm">{link.redirectDelay}s</span></Row>
                  )}
                  <Row label="Last Updated"><span className="text-sm text-muted-foreground">{timeAgo(link.updatedAt)}</span></Row>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="mt-4">
          {analytics ? <AnalyticsMini data={analytics} /> : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No analytics data yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Destination History
                <Button variant="ghost" size="icon-sm" onClick={() => refetchHistory()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No destination changes recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((h: any) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(h.createdAt)}
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 shrink-0">From:</span>
                            <span className="text-muted-foreground truncate">{h.oldUrl}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 shrink-0">To:</span>
                            <span className="truncate">{h.newUrl}</span>
                          </div>
                        </div>
                        {h.changeNote && (
                          <p className="text-xs text-muted-foreground italic">"{h.changeNote}"</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        disabled={restoreMutation.isPending}
                        onClick={() => handleRestore(h.id)}
                      >
                        Restore
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-sm text-muted-foreground sm:w-36 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
