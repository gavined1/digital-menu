import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <DashboardNav userEmail={user.email ?? ""} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
