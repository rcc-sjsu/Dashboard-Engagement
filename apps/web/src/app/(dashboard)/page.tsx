//Server Component (auth + access control)

import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return <DashboardContent />;
}
