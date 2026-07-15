import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";

export const metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, keyPrefix: true, scopes: true,
      isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
  });

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage access keys for the LinkVault API</p>
      </div>
      <ApiKeysPanel initialKeys={keys as any} />
    </div>
  );
}
