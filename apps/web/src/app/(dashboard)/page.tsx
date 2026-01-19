'use client';

import { useEffect, useState } from "react";
import { ResponsiveContainer } from "recharts";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@repo/supabase/client";
import { redirect, useRouter } from "next/navigation";
import { CardContent } from "@/components/ui/card";
import { ChartBarDefault } from "@/components/ui/bar-chart";
import { ChartLineMultiple } from "@/components/ui/line-graph"
import { ChartPieLabelList } from "@/components/ui/pie-chart"
import { ChartBarStacked } from "@/components/ui/stacked-bar-chart"
import { ChartBarHorizontal } from "@/components/ui/ChartBarHorizontal";
import { BigNumber } from "@/components/ui/kpi"
import { RetentionDistributionChart } from "@/components/ui/retention-distribution"
import { fetchAnalyticsData } from "@/lib/analytics";

export default function Page() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [router, supabase]);

  // Fetch ONLY retention data
  useEffect(() => {
    const loadRetention = async () => {
      try {
        const data = await fetchAnalyticsData();
        // Handle nested structure: data.retention.retention
        const retention = data.retention?.retention || data.retention;
        setRetentionData(retention);
      } catch (err) {
        console.error("Failed to load retention data:", err);
      }
    };

    if (user) {
      loadRetention();
    }
  }, [user]);

  if (!user) {
    return null; // Will redirect
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

        {/* ONLY retention gets real data */}
        <RetentionDistributionChart data={retentionData} />

        </div>

      </div>

      </div>
    </main>
  );
}