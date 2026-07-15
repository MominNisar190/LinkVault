import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Insights across all your links</p>
      </div>
      <AnalyticsDashboard userId={session.user.id} />
    </div>
  );
}
