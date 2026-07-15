"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Globe, Monitor, Chrome, Smartphone } from "lucide-react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface AnalyticsMiniProps {
  data: {
    total: number;
    today: number;
    month: number;
    unique: number;
    topCountries: { country: string; count: number }[];
    topBrowsers: { browser: string; count: number }[];
    topDevices: { device: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
  };
}

export function AnalyticsMini({ data }: AnalyticsMiniProps) {
  const maxCountry = data.topCountries[0]?.count ?? 1;
  const maxBrowser = data.topBrowsers[0]?.count ?? 1;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clicks",    value: data.total },
          { label: "Today",           value: data.today },
          { label: "This Month",      value: data.month },
          { label: "Unique Visitors", value: data.unique },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Countries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" /> Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCountries.slice(0, 6).map((c) => (
              <div key={c.country} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{c.country}</span>
                  <span className="text-muted-foreground">{c.count}</span>
                </div>
                <Progress value={(c.count / maxCountry) * 100} className="h-1.5" />
              </div>
            ))}
            {data.topCountries.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Chrome className="h-4 w-4 text-amber-400" /> Browsers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topBrowsers.slice(0, 6).map((b) => (
              <div key={b.browser} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{b.browser}</span>
                  <span className="text-muted-foreground">{b.count}</span>
                </div>
                <Progress value={(b.count / maxBrowser) * 100} className="h-1.5" />
              </div>
            ))}
            {data.topBrowsers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet-400" /> Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topDevices.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.topDevices.map(d => ({ name: d.device, value: d.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.topDevices.map((_, i) => (
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
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-emerald-400" /> Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.topReferrers.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="referrer"
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
