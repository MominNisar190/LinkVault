import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border-border/50 hover:border-border transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && (
              <p
                className={cn(
                  "text-xs",
                  trend !== undefined
                    ? trend >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : "text-muted-foreground"
                )}
              >
                {sub}
              </p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
