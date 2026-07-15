import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { LinkAnalytics } from "@/components/analytics/link-analytics";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Link Analytics" };

export default async function LinkAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const link = await linkRepository.findById(params.id);
  if (!link || link.userId !== session.user.id) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href={`/dashboard/links/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Link
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Detailed stats for <code className="font-mono text-primary">/{link.slug}</code>
        </p>
      </div>
      <LinkAnalytics linkId={params.id} />
    </div>
  );
}
