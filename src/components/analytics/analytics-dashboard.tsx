"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsMini } from "@/components/analytics/analytics-mini";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface Props { userId: string; }

export function AnalyticsDashboard({ userId }: Props) {
  const [range, setRange] = useState("30");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["analytics-dashboard", range],
    queryFn: async () => {
      const res = await fetch("/api/analytics/dashboard");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });

  function handleExport() {
    const url = `/api/analytics/export`;
    window.open(url, "_blank");
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Links",    value: data.totalLinks    },
          { label: "Active Links",   value: data.activeLinks   },
          { label: "Monthly Clicks", value: data.monthClicks   },
          { label: "Unique Visitors",value: data.uniqueVisitors},
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{(s.value ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clicks over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.clicksOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.clicksOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No click data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top links */}
      {data.topLinks?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topLinks.map((link: any, i: number) => (
                <div key={link.id} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.title ?? link.slug}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{link.slug}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {link.totalClicks.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
