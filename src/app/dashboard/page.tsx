import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardWizard from "@/components/DashboardWizard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <DashboardWizard />;
}
