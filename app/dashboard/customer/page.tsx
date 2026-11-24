import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UserDashboard from "@/components/dashboard/UserDashboard";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <UserDashboard user={user} />;
}
