import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user) redirect("/admin-login");
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  return <>{children}</>;
}
