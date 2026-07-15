import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/sign-in");

  // Block pending / suspended users
  const status = (session.user as any).status;
  if (status === "PENDING") redirect("/sign-in?error=PENDING_APPROVAL");
  if (status === "SUSPENDED") redirect("/sign-in?error=ACCOUNT_SUSPENDED");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={(session.user as any).role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={session.user as any} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
