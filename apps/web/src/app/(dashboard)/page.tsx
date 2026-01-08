
import AnalyticsSummary from "@/components/analytics-summary";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }


  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-4 p-24">
      
      <AnalyticsSummary />
    </main>
  );
}
