"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { Loader2, Plus, Trash2, Eye, EyeOff, Copy, Download, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { updateProfileSchema, updateSettingsSchema, createApiKeySchema } from "@/lib/validations";
import type { UpdateProfileInput, UpdateSettingsInput, CreateApiKeyInput } from "@/lib/validations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getInitials, copyToClipboard } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SettingsTabsProps {
  user: {
    id: string; name: string | null; email: string;
    avatarUrl: string | null; role: string; timezone: string;
    settings: {
      theme: string; emailNotifications: boolean; weeklyReport: boolean;
      clickThresholdAlert: boolean; clickThreshold: number; defaultRedirectDelay: number;
    } | null;
  };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword:     z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export function SettingsTabs({ user }: SettingsTabsProps) {
  const { setTheme } = useTheme();
  const qc = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword]     = useState("");
  const [newKeyValue, setNewKeyValue]           = useState<string | null>(null);
  const [showNewKey, setShowNewKey]             = useState(false);
  const [creatingKey, setCreatingKey]           = useState(false);
  const [showCurrPass, setShowCurrPass]         = useState(false);
  const [showNewPass, setShowNewPass]           = useState(false);

  // ── Profile form ──
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name ?? "", timezone: user.timezone },
  });

  async function saveProfile(data: UpdateProfileInput) {
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) toast({ title: "Profile updated" });
    else toast({ title: "Failed to update profile", variant: "destructive" });
  }

  // ── Password form ──
  const passForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function changePassword(data: PasswordForm) {
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: "Password changed successfully" });
      passForm.reset();
    } else {
      toast({ title: json.error ?? "Failed to change password", variant: "destructive" });
    }
  }

  // ── Settings form ──
  const settingsForm = useForm<UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      theme:               (user.settings?.theme as any)         ?? "system",
      emailNotifications:   user.settings?.emailNotifications     ?? true,
      weeklyReport:         user.settings?.weeklyReport           ?? true,
      clickThresholdAlert:  user.settings?.clickThresholdAlert    ?? false,
      clickThreshold:       user.settings?.clickThreshold         ?? 1000,
      defaultRedirectDelay: user.settings?.defaultRedirectDelay   ?? 0,
    },
  });

  async function saveSettings(data: UpdateSettingsInput) {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      if (data.theme) setTheme(data.theme);
      toast({ title: "Settings saved" });
    } else {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  }

  // ── API Keys ──
  const { data: apiKeys = [], refetch: refetchKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys");
      return res.json().then(d => d.data ?? []);
    },
  });

  const keyForm = useForm<CreateApiKeyInput>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: "", scopes: ["read"], expiresAt: null },
  });

  async function createKey(data: CreateApiKeyInput) {
    setCreatingKey(true);
    const res = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setNewKeyValue(json.data.key);
      refetchKeys();
      keyForm.reset();
    } else {
      toast({ title: "Failed to create key", variant: "destructive" });
    }
    setCreatingKey(false);
  }

  async function revokeKey(id: string) {
    await fetch(`/api/user/api-keys/${id}`, { method: "DELETE" });
    refetchKeys();
    toast({ title: "Key revoked" });
  }

  // ── Delete account ──
  async function handleDeleteAccount() {
    const res = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: "Account deleted" });
      signOut({ callbackUrl: "/sign-in" });
    } else {
      toast({ title: json.error ?? "Failed to delete account", variant: "destructive" });
    }
  }

  return (
    <Tabs defaultValue="profile">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      {/* ── Profile ── */}
      <TabsContent value="profile" className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your display name and timezone</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl ?? ""} />
                  <AvatarFallback className="text-lg bg-primary/20 text-primary">
                    {getInitials(user.name ?? user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name ?? "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-1">{user.role}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input {...profileForm.register("name")} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input {...profileForm.register("timezone")} placeholder="UTC" />
              </div>
              <Button type="submit" disabled={profileForm.formState.isSubmitting} className="gap-2">
                {profileForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passForm.handleSubmit(changePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrPass ? "text" : "password"}
                    placeholder="Current password"
                    {...passForm.register("currentPassword")}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrPass(!showCurrPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{passForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Min 8 characters"
                    {...passForm.register("newPassword")}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{passForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  {...passForm.register("confirmPassword")}
                />
                {passForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{passForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={passForm.formState.isSubmitting} className="gap-2">
                {passForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Preferences ── */}
      <TabsContent value="preferences" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your dashboard experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={settingsForm.handleSubmit(saveSettings)} className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settingsForm.watch("theme") as string}
                  onValueChange={(v) => settingsForm.setValue("theme", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Redirect Delay (seconds)</Label>
                <Input type="number" min={0} max={30}
                  {...settingsForm.register("defaultRedirectDelay", { valueAsNumber: true })} />
              </div>
              <Separator />
              <p className="text-sm font-medium">Notifications</p>
              {[
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive important account emails" },
                { key: "weeklyReport",       label: "Weekly Report",       desc: "Weekly summary of your link performance" },
                { key: "clickThresholdAlert",label: "Click Threshold Alert",desc: "Alert when a link hits a threshold" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={settingsForm.watch(key as any)}
                    onCheckedChange={(v) => settingsForm.setValue(key as any, v)}
                  />
                </div>
              ))}
              {settingsForm.watch("clickThresholdAlert") && (
                <div className="space-y-2">
                  <Label>Click Threshold</Label>
                  <Input type="number" min={1}
                    {...settingsForm.register("clickThreshold", { valueAsNumber: true })} />
                </div>
              )}
              <Button type="submit" disabled={settingsForm.formState.isSubmitting} className="gap-2">
                {settingsForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── API Keys ── */}
      <TabsContent value="api-keys" className="mt-6 space-y-4">
        {newKeyValue && (
          <Card className="border-emerald-500/20 bg-emerald-950/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-emerald-400">
                ✓ Your API key — copy it now, it won't be shown again
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs bg-black/20 p-2 rounded font-mono break-all">
                  {showNewKey ? newKeyValue : "•".repeat(40)}
                </code>
                <Button size="icon-sm" variant="ghost" onClick={() => setShowNewKey(!showNewKey)}>
                  {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => {
                  copyToClipboard(newKeyValue);
                  toast({ title: "Key copied" });
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setNewKeyValue(null)}>Dismiss</Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
            <CardDescription>Use keys to access LinkVault from external applications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={keyForm.handleSubmit(createKey)} className="flex gap-3">
              <Input placeholder="Key name" {...keyForm.register("name")} className="flex-1" />
              <Button type="submit" disabled={creatingKey} className="gap-2 shrink-0">
                {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Keys</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {apiKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No API keys yet</p>
            )}
            {apiKeys.map((key: any) => (
              <div key={key.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}••••••••••••</p>
                  {key.lastUsedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="destructive" onClick={() => revokeKey(key.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Account ── */}
      <TabsContent value="account" className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download all your links and analytics</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => window.open("/api/analytics/export", "_blank")} className="gap-2">
              <Download className="h-4 w-4" /> Export Analytics CSV
            </Button>
            <Button variant="outline" onClick={() => window.open("/api/user/export", "_blank")} className="gap-2">
              <Download className="h-4 w-4" /> Export All Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete My Account
            </Button>
          </CardContent>
        </Card>

        {/* Delete account dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Delete Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. All your links, analytics, and data will be permanently deleted.
                Enter your password to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={!deletePassword.trim()}
                onClick={handleDeleteAccount}
              >
                Delete Account Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
}
