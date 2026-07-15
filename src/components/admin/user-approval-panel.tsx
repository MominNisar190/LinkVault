"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, UserCheck, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";

export function UserApprovalPanel() {
  const qc = useQueryClient();

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?status=PENDING&limit=50");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 30_000, // poll every 30s
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Approve failed");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "User approved — they can now sign in" });
    },
    onError: (err: any) => toast({ title: `Failed to approve: ${err.message}`, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Registration rejected by admin" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Reject failed");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User rejected" });
    },
    onError: (err: any) => toast({ title: `Failed to reject: ${err.message}`, variant: "destructive" }),
  });

  return (
    <Card className={pendingUsers.length > 0 ? "border-amber-500/30 bg-amber-950/10" : ""}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserCheck className="h-5 w-5 text-amber-400" />
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
                {pendingUsers.length > 9 ? "9+" : pendingUsers.length}
              </span>
            )}
          </div>
          <div>
            <CardTitle className="text-base">Pending Approvals</CardTitle>
            <CardDescription>
              {pendingUsers.length === 0
                ? "No users waiting for approval"
                : `${pendingUsers.length} user${pendingUsers.length !== 1 ? "s" : ""} waiting for your approval`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500/40" />
            <p className="text-sm">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="divide-y divide-border">
              {pendingUsers.map((user: any) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-500/20 text-amber-400 text-sm font-semibold">
                        {getInitials(user.name ?? user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Registered {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="warning" className="text-xs">Pending</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-1.5 h-8"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(user.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 h-8"
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(user.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
