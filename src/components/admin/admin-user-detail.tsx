"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Link2, BarChart3, History, Shield,
  CheckCircle2, XCircle, Clock, Globe, Monitor, Smartphone,
  Tablet, ExternalLink, Copy, MousePointerClick, TrendingUp,
  Calendar, Mail, Hash, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  getInitials, formatNumber, formatDate, formatDateTime,
  timeAgo, copyToClipboard, buildShortUrl, getDomain, truncate,
} from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

interface Props { userId: string }

const STATUS_CONFIG = {
  ACTIVE:    { label: "Active",    variant: "success"     as const },
  PENDING:   { label: "Pending",   variant: "warning"     as const },
  SUSPENDED: { label: "Suspended", variant: "destructive" as const },
};

const LINK_STATUS_CONFIG = {
  ACTIVE:   { label: "Active",   icon: CheckCircle2, color: "text-emerald-400" },
  INACTIVE: { label: "Inactive", icon: XCircle,      color: "text-amber-400"  },
  ARCHIVED: { label: "Archived", icon: Clock,        color: "text-slate-400"  },
  EXPIRED:  { label: "Expired",  icon: Clock,        color: "text-red-400"    },
} as const;

const DEVICE_ICON = {
  DESKTOP: Monitor,
  MOBILE:  Smartphone,
  TABLET:  Tablet,
  BOT:     Shield,
  UNKNOWN: Monitor,
} as const;

const CHART_COLORS = ["#818cf8", "#34d399", "#f59e0b", "#f87171", "#60a5fa", "#a78bfa", "#fb923c", "#4ade80"];

export function AdminUserDetail({ userId }: Props) {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load user");
      return json.data;
    },
  });

  if (isLoading) return <AdminUserDetailSkeleton />;
  if (!data) return (
    <div className="text-center py-20 text-muted-foreground">Failed to load user data.</div>
  );

  const { user, links, linkHistory, analytics, auditLogs } = data;
  const statusCfg = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatarUrl ?? ""} />
            <AvatarFallback>{getInitials(user.name ?? user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{user.name ?? "No name"}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {user.isBanned && <Badge variant="destructive">Banned</Badge>}
            <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Links",    value: formatNumber(links.length),                icon: Link2,             color: "text-violet-400" },
          { label: "Total Clicks",   value: formatNumber(analytics.totalClicks),        icon: MousePointerClick, color: "text-amber-400"  },
          { label: "Unique Visitors",value: formatNumber(analytics.uniqueVisitors),     icon: TrendingUp,        color: "text-emerald-400"},
          { label: "This Month",     value: formatNumber(analytics.monthClicks),        icon: Calendar,          color: "text-blue-400"   },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="links">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="links">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Analytics
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-3.5 w-3.5 mr-1.5" />Link History ({linkHistory.length})
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-3.5 w-3.5 mr-1.5" />Profile
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-3.5 w-3.5 mr-1.5" />Audit ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── LINKS TAB ── */}
        <TabsContent value="links" className="mt-4">
          <Card className="overflow-hidden">
            {links.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No links created yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Short Link</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Destination</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Clicks</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link: any) => {
                      const sc = LINK_STATUS_CONFIG[link.status as keyof typeof LINK_STATUS_CONFIG] ?? LINK_STATUS_CONFIG.ACTIVE;
                      const Icon = sc.icon;
                      return (
                        <tr key={link.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={buildShortUrl(link.slug)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-primary text-xs hover:underline"
                                >
                                  {buildShortUrl(link.slug)}
                                </a>
                                <button
                                  onClick={() => { copyToClipboard(buildShortUrl(link.slug)); toast({ title: "Copied" }); }}
                                  className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                              {link.title && <span className="text-xs text-muted-foreground">{link.title}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-1 text-muted-foreground max-w-[200px]">
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">{getDomain(link.destinationUrl)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="font-semibold">{formatNumber(link.totalClicks)}</span>
                            <span className="text-xs text-muted-foreground ml-1">({formatNumber(link.uniqueClicks)})</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className={`flex items-center gap-1 text-xs font-medium ${sc.color}`}>
                              <Icon className="h-3.5 w-3.5" />{sc.label}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                            {timeAgo(link.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── ANALYTICS TAB ── */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Clicks over time chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clicks Over Time (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.clicksChart.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">No click data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.clicksChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#e2e8f0" }}
                      itemStyle={{ color: "#818cf8" }}
                    />
                    <Area type="monotone" dataKey="clicks" stroke="#818cf8" strokeWidth={2} fill="url(#cg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Countries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-blue-400" />Top Countries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.topCountries.length === 0
                  ? <p className="text-xs text-muted-foreground">No data</p>
                  : analytics.topCountries.map((c: any, i: number) => (
                    <div key={c.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-sm">{c.country}</span>
                      </div>
                      <span className="text-xs font-semibold">{formatNumber(c.count)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Top Browsers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4 text-violet-400" />Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topBrowsers.length === 0
                  ? <p className="text-xs text-muted-foreground">No data</p>
                  : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={analytics.topBrowsers} layout="vertical" margin={{ left: 0, right: 8 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="browser" tick={{ fontSize: 10, fill: "#e2e8f0" }} tickLine={false} axisLine={false} width={55} />
                        <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11 }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {analytics.topBrowsers.map((_: any, i: number) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4 text-emerald-400" />Devices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.topDevices.length === 0
                  ? <p className="text-xs text-muted-foreground">No data</p>
                  : analytics.topDevices.map((d: any, i: number) => {
                    const Icon = DEVICE_ICON[d.device as keyof typeof DEVICE_ICON] ?? Monitor;
                    return (
                      <div key={d.device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm capitalize">{d.device.toLowerCase()}</span>
                        </div>
                        <span className="text-xs font-semibold">{formatNumber(d.count)}</span>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── LINK HISTORY TAB (before/after edits) ── */}
        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Destination URL Changes</CardTitle>
              <CardDescription>Every before → after edit the user made to their link destinations</CardDescription>
            </CardHeader>
            {linkHistory.length === 0 ? (
              <CardContent>
                <div className="py-10 text-center text-muted-foreground text-sm">No link edits recorded yet.</div>
              </CardContent>
            ) : (
              <div className="divide-y divide-border">
                {linkHistory.map((h: any) => (
                  <div key={h.id} className="px-4 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <History className="h-4 w-4 text-violet-400 shrink-0" />
                        <span className="font-mono text-sm font-medium text-primary truncate">
                          /{h.link?.slug ?? "—"}
                        </span>
                        {h.link?.title && (
                          <span className="text-xs text-muted-foreground truncate">— {h.link.title}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(h.createdAt)}</span>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-red-400 w-12 shrink-0 mt-0.5">Before</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-muted-foreground break-all">{h.oldUrl}</span>
                          <button
                            onClick={() => { copyToClipboard(h.oldUrl); toast({ title: "Copied old URL" }); }}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-emerald-400 w-12 shrink-0 mt-0.5">After</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs break-all">{h.newUrl}</span>
                          <button
                            onClick={() => { copyToClipboard(h.newUrl); toast({ title: "Copied new URL" }); }}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {h.changeNote && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-12 shrink-0 mt-0.5">Note</span>
                          <span className="text-xs text-muted-foreground italic">{h.changeNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Account Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "User ID",       value: user.id,        icon: Hash    },
                  { label: "Email",         value: user.email,     icon: Mail    },
                  { label: "Name",          value: user.name ?? "—", icon: User  },
                  { label: "Role",          value: user.role,      icon: Shield  },
                  { label: "Status",        value: user.status,    icon: CheckCircle2 },
                  { label: "Timezone",      value: user.timezone,  icon: Globe   },
                  { label: "Joined",        value: formatDateTime(user.createdAt), icon: Calendar },
                  { label: "Last Updated",  value: formatDateTime(user.updatedAt), icon: Calendar },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <row.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                    <span className="font-medium break-all">{row.value}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-28 shrink-0">Email Verified</span>
                  {user.emailVerified
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    : <XCircle className="h-4 w-4 text-red-400" />}
                </div>
                {user.isBanned && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3 space-y-1">
                      <p className="text-xs font-semibold text-red-400">Banned</p>
                      <p className="text-xs text-muted-foreground">{user.banReason ?? "No reason provided"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Account Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "Total Links",    value: user._count.links    },
                  { label: "API Keys",       value: user._count.apiKeys  },
                  { label: "Audit Events",   value: user._count.auditLogs},
                  { label: "Total Clicks",   value: analytics.totalClicks },
                  { label: "Unique Visitors",value: analytics.uniqueVisitors },
                  { label: "Today's Clicks", value: analytics.todayClicks },
                  { label: "Month Clicks",   value: analytics.monthClicks },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-bold">{formatNumber(row.value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AUDIT LOGS TAB ── */}
        <TabsContent value="audit" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>All actions performed by this user</CardDescription>
            </CardHeader>
            {auditLogs.length === 0 ? (
              <CardContent>
                <div className="py-10 text-center text-muted-foreground text-sm">No audit events yet.</div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Resource</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Details</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">IP</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground">
                          {log.resource}
                          {log.resourceId ? <span className="ml-1 opacity-50">· {log.resourceId.slice(0, 8)}…</span> : null}
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.metadata ? truncate(JSON.stringify(log.metadata), 60) : "—"}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                          {log.ipAddress ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgo(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function AdminUserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
