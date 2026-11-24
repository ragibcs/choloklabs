import { redirect } from "next/navigation";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "EMPLOYEE" && user.role !== "HR" && user.role !== "ADMIN") {
    redirect(dashboardPathForRole(user.role));
  }

  return <EmployeeDashboard user={user} />;
}
