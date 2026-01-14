import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import AdminImportPanel from "@/components/admin/AdminImportPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  return (
    <main className="flex h-full w-full flex-col gap-6 p-10">
      <h1 className="text-3xl font-semibold">Admin Page</h1>
      <AdminImportPanel />
    </main>
  );
}
