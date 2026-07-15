import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { linkRepository } from "@/repositories/link.repository";
import { EditLinkForm } from "@/components/links/edit-link-form";

export const metadata = { title: "Edit Link" };

export default async function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const link = await linkRepository.findById(id);
  if (!link || link.userId !== session.user.id) notFound();

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Link</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update settings for <code className="font-mono text-primary">/{link.slug}</code>
        </p>
      </div>
      <EditLinkForm link={link as any} />
    </div>
  );
}
