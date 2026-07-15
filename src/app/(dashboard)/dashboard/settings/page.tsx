import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findFirst({
    where:   { id: session.user.id, deletedAt: null },
    include: { settings: true },
    omit:    { passwordHash: true },
  } as any);

  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>
      <SettingsTabs user={user as any} />
    </div>
  );
}
