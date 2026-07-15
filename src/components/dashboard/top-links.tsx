import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, truncate, getDomain } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface TopLinksProps {
  links: {
    id: string;
    slug: string;
    title: string | null;
    destinationUrl: string;
    totalClicks: number;
  }[];
}

export function TopLinks({ links }: TopLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No links yet</p>
        )}
        {links.map((link, i) => (
          <div key={link.id} className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/links/${link.id}`}
                className="text-sm font-medium hover:text-primary transition-colors truncate block"
              >
                {link.title ?? link.slug}
              </Link>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <ExternalLink className="h-2.5 w-2.5" />
                {getDomain(link.destinationUrl)}
              </p>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              {formatNumber(link.totalClicks)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
