import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { ChartLineMultiple } from "@/components/ui/line-graph"
import { ChartPieLabelList } from "@/components/ui/pie-chart"
import { ChartBarStacked } from "@/components/ui/stacked-bar-chart"
import { BigNumber } from "@/components/ui/kpi"
import { RetentionDistributionChart } from "@/components/ui/retention-distribution"

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }
  return (
    <main className="flex h-full w-full items-center flex-col justify-center gap-4 p-32">
      <div className="">
        
        <div className="flex flex-col mb-5 gap-5">
          <h1 className="text-3xl font-semibold">RCC Engagement Dashboard</h1>
          <h3>
            Overview & Growth
          </h3>
        </div>

        <div className="items-center">

        
        <div className="flex flex-col w-full gap-20 ">
           <div className="flex w-full gap-20">
              
              <div className="flex-1">
                <BigNumber />
              </div>
              <div className="flex-1">
                <BigNumber />
              </div>
              <div className="flex-1">
                <BigNumber />
              </div>
            </div>

          <div className="w-full">
            <ChartLineMultiple></ChartLineMultiple>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <BigNumber />
            <BigNumber />
            <BigNumber />
            <BigNumber />
          </div>
          <div className="w-full">
            <ChartLineMultiple />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ChartPieLabelList />
            </div>
            <div className="lg:col-span-2">
              <ChartBarStacked />
            </div>
          </div>
        </div>

        <RetentionDistributionChart></RetentionDistributionChart>

        </div>

      </div>
    </main>
  );
}
