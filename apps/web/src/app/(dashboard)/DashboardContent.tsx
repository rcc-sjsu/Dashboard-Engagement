"use client"; //Client Component:  interactive UI (toggles, charts, state)

import { useEffect, useState } from "react";
// import { ResponsiveContainer } from "recharts";
import { ChartLineMultiple } from "@/components/ui/line-graph";
import { ChartPieLabelList } from "@/components/ui/pie-chart";
import { ChartBarStacked } from "@/components/ui/stacked-bar-chart";
import { BigNumber } from "@/components/ui/kpi";
import { RetentionDistributionChart } from "@/components/ui/retention-distribution";
import { fetchRetentionData } from "@/lib/retention";

export default function DashboardContent() {
  const [retentionData, setRetentionData] = useState<any>(null);

  // Fetch ONLY retention data (for now)
  useEffect(() => {
    const loadRetention = async () => {
      try {
        const data = await fetchRetentionData();
        const retention = data.retention?.retention || data.retention; //extract retention data if it exist
        setRetentionData(retention);
      } catch (err) {
        console.error("Failed to load retention data:", err);
      }
    };

    loadRetention();
  }, []);

  return (
    <main className="flex h-full w-full items-center flex-col justify-center gap-4 p-32">
      <div className="">
        <div className="flex flex-col mb-5 gap-5">
          <h1 className="text-3xl font-semibold">RCC Engagement Dashboard</h1>
          <h3>Overview & Growth</h3>
        </div>

        <div className="items-center">
          <div className="flex flex-col w-full gap-20 ">
            <div className="flex w-full gap-20">
              <div className="flex-1">
                <BigNumber title={""} date={""} trending={false} />
              </div>
              <div className="flex-1">
                <BigNumber title={""} date={""} trending={false} />
              </div>
              <div className="flex-1">
                <BigNumber title={""} date={""} trending={false} />
              </div>
            </div>

            <div className="w-full">
              <ChartLineMultiple></ChartLineMultiple>
            </div>

            <div className="w-full flex justify-center">
              <div className="flex gap-8 w-full ">
                <div className="flex-[1] h-full">
                  <ChartPieLabelList />
                </div>
                <div className="flex-[2] h-full">
                  <ChartBarStacked />
                </div>
              </div>
            </div>

            {/* pass in data to retention */}
            <RetentionDistributionChart data={retentionData} />
          </div>
        </div>
      </div>
    </main>
  );
}
