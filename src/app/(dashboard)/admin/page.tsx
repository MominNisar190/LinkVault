import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform management and oversight</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
