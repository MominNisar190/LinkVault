"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, EyeOff, Copy, Loader2, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatDate, copyToClipboard } from "@/lib/utils";

interface ApiKeysPanelProps {
  initialKeys: {
    id: string; name: string; keyPrefix: string; scopes: string[];
    isActive: boolean; lastUsedAt: Date | null; expiresAt: Date | null; createdAt: Date;
  }[];
}

export function ApiKeysPanel({ initialKeys }: ApiKeysPanelProps) {
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: keys = initialKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys");
      const json = await res.json();
      return json.data ?? [];
    },
    initialData: initialKeys,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes: ["read", "write"] }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      if (data.success) {
        setNewKeyValue(data.data.key);
        setNewKeyName("");
      }
    },
    onError: () => toast({ title: "Failed to create key", variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key revoked" });
    },
  });

  return (
    <div className="space-y-6">
      {/* New key revealed */}
      {newKeyValue && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-400">
                Your new API key — copy it now, it won't be shown again
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs bg-black/20 p-2.5 rounded-lg font-mono break-all border border-emerald-500/20">
                {showKey ? newKeyValue : "•".repeat(52)}
              </code>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={async () => {
                    await copyToClipboard(newKeyValue);
                    toast({ title: "Key copied" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setNewKeyValue(null)}>
              I've saved it, dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
          <CardDescription>Keys allow programmatic access to your links via the API</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newKeyName.trim()) createMutation.mutate(newKeyName.trim());
            }}
            className="flex gap-3"
          >
            <Input
              placeholder="e.g. My App Integration"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createMutation.isPending || !newKeyName.trim()} className="gap-2 shrink-0">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>{keys.filter((k: any) => k.isActive).length} active key(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No API keys yet</p>
          ) : (
            <div className="divide-y divide-border">
              {keys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{key.name}</p>
                      {!key.isActive && <Badge variant="destructive" className="text-xs">Revoked</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••••••••••••••</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(key.createdAt)}
                      {key.lastUsedAt && ` · Last used ${formatDate(key.lastUsedAt)}`}
                    </p>
                  </div>
                  {key.isActive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => revokeMutation.mutate(key.id)}
                      disabled={revokeMutation.isPending}
                      className="gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
