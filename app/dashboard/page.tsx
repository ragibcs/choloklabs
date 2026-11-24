import { redirect } from "next/navigation";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect(dashboardPathForRole(user.role));
}
