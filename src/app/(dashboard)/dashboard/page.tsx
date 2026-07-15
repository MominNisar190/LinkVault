import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/analytics";
import { DashboardStats } from "@/components/dashboard/stats";
import { TopLinks } from "@/components/dashboard/top-links";
import { ClicksChart } from "@/components/dashboard/clicks-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsSkeleton } from "@/components/dashboard/stats-skeleton";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
  });
  if (!user) redirect("/sign-in");

  const stats = await getDashboardStats(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {user.name ?? user.email}
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats stats={stats} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ClicksChart data={stats.clicksOverTime} />
        </div>
        <div>
          <TopLinks links={stats.topLinks} />
        </div>
      </div>

      <RecentActivity activity={stats.recentActivity} />
    </div>
  );
}
