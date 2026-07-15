"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Calendar } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface LinkAnalyticsProps {
  linkId: string;
}

export function LinkAnalytics({ linkId }: LinkAnalyticsProps) {
  const [groupBy, setGroupBy] = useState<"hour" | "day" | "week" | "month">("day");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["link-analytics-full", linkId, groupBy, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ groupBy, startDate, endDate });
      const res = await fetch(`/api/analytics/links/${linkId}?${params}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!linkId,
  });

  function handleExport() {
    window.open(`/api/analytics/export?linkId=${linkId}`, "_blank");
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const maxCountry = data.countries[0]?.count ?? 1;
  const maxBrowser = data.browsers[0]?.count ?? 1;
  const maxOs = data.operatingSystems[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border border-input bg-background rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Hourly</SelectItem>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Clicks over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.timeSeries?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.timeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#lg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
              No click data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <Tabs defaultValue="geo">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geo">Geography</TabsTrigger>
          <TabsTrigger value="tech">Technology</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        {/* ── Geography ── */}
        <TabsContent value="geo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.countries?.length > 0 ? (
                data.countries.slice(0, 15).map((c: any) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums">{formatNumber(c.count)}</span>
                    </div>
                    <Progress value={(c.count / maxCountry) * 100} className="h-1.5" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No geo data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Technology ── */}
        <TabsContent value="tech" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Browsers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.browsers?.length > 0 ? (
                  data.browsers.map((b: any) => (
                    <div key={b.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{b.name}</span>
                        <span className="text-muted-foreground tabular-nums">{b.count}</span>
                      </div>
                      <Progress value={(b.count / maxBrowser) * 100} className="h-1.5" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operating Systems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.operatingSystems?.length > 0 ? (
                  data.operatingSystems.map((o: any) => (
                    <div key={o.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{o.name}</span>
                        <span className="text-muted-foreground tabular-nums">{o.count}</span>
                      </div>
                      <Progress value={(o.count / maxOs) * 100} className="h-1.5" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Devices ── */}
        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              {data.devices?.length > 0 ? (
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.devices.map((d: any) => ({ name: d.name, value: d.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        labelLine={false}
                      >
                        {data.devices.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {data.devices.map((d: any, i: number) => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>{d.name}</span>
                        <span className="text-muted-foreground ml-auto tabular-nums">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No device data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sources ── */}
        <TabsContent value="sources" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                {data.referrers?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={data.referrers.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 0, right: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No referrer data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">UTM Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {data.utmSources?.length > 0 ? (
                  <div className="space-y-3">
                    {data.utmSources.map((u: any) => (
                      <div key={u.name} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{u.name}</span>
                        <span className="text-muted-foreground tabular-nums">{formatNumber(u.count)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No UTM data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
