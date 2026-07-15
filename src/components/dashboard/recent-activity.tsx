import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { Globe } from "lucide-react";

interface RecentActivityProps {
  activity: {
    clickedAt: Date;
    country: string | null;
    browser: string | null;
    linkId: string;
  }[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
        )}
        <div className="space-y-2">
          {activity.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
              <div className="p-1.5 rounded-md bg-muted">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{item.country ?? "Unknown"}</span>
                <span className="text-muted-foreground"> via {item.browser ?? "Unknown"}</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(item.clickedAt)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
