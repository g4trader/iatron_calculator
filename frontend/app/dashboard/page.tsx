import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authz";

export default async function DashboardPage() {
  await requireAuth();
  redirect("/dashboard/pcr");
}
