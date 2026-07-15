"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { SearchInput } from "@/lib/validations";

const API = "/api/links";

async function fetcher<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

export function useLinks(params?: Partial<SearchInput>) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.projectId) query.set("projectId", params.projectId);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

  return useQuery({
    queryKey: ["links", params],
    queryFn: async () => {
      const res = await fetch(`${API}?${query}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Request failed");
      // Return both data and meta so consumers can access pagination
      return { data: json.data, meta: json.meta };
    },
  });
}

export function useLink(id: string) {
  return useQuery({
    queryKey: ["link", id],
    queryFn: () => fetcher(`${API}/${id}`),
    enabled: !!id,
  });
}

export function useLinkAnalytics(id: string) {
  return useQuery({
    queryKey: ["link-analytics", id],
    queryFn: () => fetcher(`${API}/${id}/analytics`),
    enabled: !!id,
  });
}

export function useLinkHistory(id: string) {
  return useQuery({
    queryKey: ["link-history", id],
    queryFn: () => fetcher(`${API}/${id}/history`),
    enabled: !!id,
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetcher(API, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Link created", variant: "default" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create link", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      fetcher(`${API}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["link", vars.id] });
      toast({ title: "Link updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`${API}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Link deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useDuplicateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`${API}/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      toast({ title: "Link duplicated" });
    },
  });
}

export function useBulkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; action: string }) =>
      fetcher(`${API}/bulk`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["links"] });
      toast({ title: `Bulk ${vars.action} completed` });
    },
  });
}

export function useToggleLinkStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" | "ARCHIVED" }) =>
      fetcher(`${API}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["link", vars.id] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    },
  });
}

export function useRestoreHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId, historyId }: { linkId: string; historyId: string }) =>
      fetcher(`${API}/${linkId}/history`, { method: "POST", body: JSON.stringify({ historyId }) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["link", vars.linkId] });
      qc.invalidateQueries({ queryKey: ["link-history", vars.linkId] });
      toast({ title: "Destination restored" });
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetcher("/api/analytics/dashboard"),
    refetchInterval: 60_000,
  });
}
