import { redirect } from "next/navigation";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import HrDashboard from "@/components/dashboard/HrDashboard";

export const dynamic = "force-dynamic";

export default async function HrDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "HR" && user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  return <HrDashboard user={user} />;
}
