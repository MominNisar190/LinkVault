import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { name: true, email: true },
  });
  if (!user) return { title: "User Not Found" };
  return { title: `User: ${user.name ?? user.email}` };
}

export default async function AdminUserPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, email: true },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminUserDetail userId={id} />
    </div>
  );
}
