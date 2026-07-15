import { Suspense } from "react";
import { LinksTable } from "@/components/links/links-table";
import { LinksTableSkeleton } from "@/components/links/links-table-skeleton";
import { CreateLinkButton } from "@/components/links/create-link-button";

export const metadata = { title: "Links" };

export default function LinksPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your dynamic links</p>
        </div>
        <CreateLinkButton />
      </div>
      <Suspense fallback={<LinksTableSkeleton />}>
        <LinksTable />
      </Suspense>
    </div>
  );
}
