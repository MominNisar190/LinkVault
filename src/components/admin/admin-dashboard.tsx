"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Link2, MousePointerClick, ShieldAlert, Search,
  Ban, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight,
  FileText, TrendingUp, UserCheck, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserApprovalPanel } from "@/components/admin/user-approval-panel";
import { toast } from "@/hooks/use-toast";
import { getInitials, formatNumber, timeAgo, formatDate } from "@/lib/utils";

export function AdminDashboard() {
  const qc     = useQueryClient();
  const router = useRouter();
  const [userSearch, setUserSearch] = useState("");
  const [userPage,   setUserPage]   = useState(1);
  const [banTarget,  setBanTarget]  = useState<{ id: string; name: string } | null>(null);
  const [banReason,  setBanReason]  = useState("");

  // ── Stats ──
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      return res.json().then((d) => d.data);
    },
  });

  // ── Users (all) ──
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", userSearch, userPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(userPage), limit: "20" });
      if (userSearch) params.set("q", userSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      return res.json();
    },
  });

  // ── Audit logs ──
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-logs?limit=50");
      return res.json();
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "User banned" });
      setBanTarget(null);
      setBanReason("");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User unbanned" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "User approved" });
    },
  });

  const stats    = statsData;
  const users    = usersData?.data ?? [];
  const userMeta = usersData?.meta ?? {};
  const logs     = logsData?.data ?? [];

  const statusColor = (status: string) => {
    if (status === "ACTIVE")    return "success";
    if (status === "PENDING")   return "warning";
    if (status === "SUSPENDED") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Pending approvals — shown prominently at the top */}
      <UserApprovalPanel />

      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Users",        value: stats?.totalUsers,  icon: Users,             color: "text-blue-400"    },
          { label: "Total Links",  value: stats?.totalLinks,  icon: Link2,             color: "text-violet-400"  },
          { label: "Total Clicks", value: stats?.totalClicks, icon: MousePointerClick, color: "text-amber-400"   },
          { label: "Active Links", value: stats?.activeLinks, icon: TrendingUp,        color: "text-emerald-400" },
          { label: "Banned Users", value: stats?.bannedUsers, icon: ShieldAlert,       color: "text-red-400"     },
          { label: "Pending",      value: stats?.pendingUsers ?? 0, icon: UserCheck,   color: "text-orange-400"  },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                  <div>
                    <p className="text-lg font-bold">{formatNumber(s.value ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />All Users</TabsTrigger>
          <TabsTrigger value="links"><Link2 className="h-4 w-4 mr-2" />Links</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-2" />Audit Logs</TabsTrigger>
        </TabsList>

        {/* ── All Users ── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users…"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetchUsers()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Card className="overflow-hidden">
            {usersLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Links</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="w-32 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl ?? ""} />
                            <AvatarFallback className="text-xs">{getInitials(user.name ?? user.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">
                              {user.name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {user._count?.links ?? 0}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColor(user.status) as any} className="text-xs">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex gap-1.5 justify-end"
                          onClick={(e) => e.stopPropagation()} // prevent row click when using action buttons
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          {user.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                          )}
                          {user.isBanned ? (
                            <Button
                              size="sm" variant="outline"
                              className="text-xs h-7"
                              onClick={() => unbanMutation.mutate(user.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Unban
                            </Button>
                          ) : user.status === "ACTIVE" ? (
                            <Button
                              size="sm" variant="destructive"
                              className="text-xs h-7"
                              onClick={() => setBanTarget({ id: user.id, name: user.name ?? user.email })}
                            >
                              <Ban className="h-3 w-3 mr-1" /> Ban
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {(userMeta.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {userPage} of {userMeta.totalPages} · {userMeta.total} users
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={userPage >= userMeta.totalPages} onClick={() => setUserPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Links ── */}
        <TabsContent value="links" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recently Created Links</CardTitle></CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-3">
                  {(stats?.recentLinks ?? []).map((link: any) => (
                    <div key={link.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-mono font-medium">/{link.slug}</p>
                        <p className="text-xs text-muted-foreground">{link.title ?? "No title"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatNumber(link.totalClicks)} clicks</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(link.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Logs ── */}
        <TabsContent value="logs" className="mt-4">
          <Card className="overflow-hidden">
            {logsLoading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Resource</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground text-xs">
                        {log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}…` : ""}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                        {log.user?.email ?? "System"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {timeAgo(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban dialog */}
      <Dialog open={!!banTarget} onOpenChange={() => setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Banning <strong>{banTarget?.name}</strong> will prevent them from signing in.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => banMutation.mutate({ userId: banTarget!.id, reason: banReason })}
            >
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
