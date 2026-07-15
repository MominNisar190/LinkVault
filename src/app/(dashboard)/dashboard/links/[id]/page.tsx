import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { LinkDetail } from "@/components/links/link-detail";

export const metadata = { title: "Link Details" };

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const link = await linkRepository.findByIdWithRelations(id);
  if (!link || link.userId !== session.user.id) notFound();

  return (
    <div className="animate-fade-in">
      <LinkDetail link={link as any} />
    </div>
  );
}
