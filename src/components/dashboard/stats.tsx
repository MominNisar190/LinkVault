"use client";

import { motion } from "framer-motion";
import { Link2, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, getPercentageChange } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsProps {
  stats: {
    totalLinks: number;
    activeLinks: number;
    todayClicks: number;
    monthClicks: number;
    uniqueVisitors: number;
    clickGrowth: number;
  };
}

const statCards = (stats: StatsProps["stats"]) => [
  {
    label: "Total Links",
    value: formatNumber(stats.totalLinks),
    sub: `${stats.activeLinks} active`,
    icon: Link2,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    label: "Today's Clicks",
    value: formatNumber(stats.todayClicks),
    sub: "Last 24 hours",
    icon: MousePointerClick,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    label: "Monthly Clicks",
    value: formatNumber(stats.monthClicks),
    sub: `${stats.clickGrowth > 0 ? "+" : ""}${stats.clickGrowth}% vs last month`,
    icon: TrendingUp,
    color: stats.clickGrowth >= 0 ? "text-emerald-400" : "text-red-400",
    bg: stats.clickGrowth >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    highlight: true,
    growth: stats.clickGrowth,
  },
  {
    label: "Unique Visitors",
    value: formatNumber(stats.uniqueVisitors),
    sub: "All time",
    icon: Users,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

export function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards(stats).map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="border-border/50 hover:border-border transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                  <p className={cn("text-xs mt-1.5", card.color)}>{card.sub}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
