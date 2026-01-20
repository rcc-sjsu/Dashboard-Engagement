import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";

import { RetentionDistributionChart } from "@/components/ui/retention/retention-distribution";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const base = process.env.NEXT_PUBLIC_SERVER_URL;
  const res = await fetch(`${base}/analytics/retention`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Retention fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const retention = json?.retention?.retention ?? json?.retention ?? json;

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            RCC Engagement Dashboard
          </h1>
          <h3 className="text-sm font-medium text-muted-foreground sm:text-base">
            Retention
          </h3>
        </div>

        <div className="min-w-0">
          <RetentionDistributionChart data={retention} />
        </div>
      </div>
    </main>
  );
}
