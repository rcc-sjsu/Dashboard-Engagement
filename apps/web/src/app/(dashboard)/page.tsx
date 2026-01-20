//Server Component (auth + access control)

import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function Page() {
  //Original auth logic
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  //client component in seperate file
  return <DashboardContent />;
}
