"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateLinkButton() {
  return (
    <Link href="/dashboard/links/new">
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Create Link
      </Button>
    </Link>
  );
}
