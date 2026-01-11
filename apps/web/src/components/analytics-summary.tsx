'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData } from '@/lib/analytics';
import { ChartLineMultiple } from "@/components/ui/line-graph"
import { ChartPieLabelList } from "@/components/ui/pie-chart"
import { ChartBarStacked } from "@/components/ui/stacked-bar-chart"
import { ChartBarHorizontal } from "@/components/ui/ChartBarHorizontal";
import { BigNumber } from "@/components/ui/kpi"

interface DashboardData {
  meta: {
    start: string;
    end: string;
  };
  overview: {
    kpis: {
      total_members: number;
      active_members: number;
      active_member_pct: number;
      registered_growth_last_30d_pct: number;
    };
    members_over_time: Array<{
      period: string;
      registered_members_cumulative: number;
      active_members_cumulative: number;
    }>;
  };
  mission: {
    major_category_distribution: Array<{
      major_category: string;
      members: number;
    }>;
    class_year_distribution: Array<{
      class_year: string;
      members: number;
    }>;
    event_major_category_percent: Array<{
      event_id: string;
      event_title: string;
      starts_at: string;
      total_attendees: number;
      segments: Array<{
        major_category: string;
        pct: number;
        count: number;
      }>;
    }>;
  };
  retention: {
    attendance_count_distribution_overall: Array<{
      events_attended_bucket: string;
      people: number;
    }>;
    attendance_count_distribution_by_major_category: Array<{
      major_category: string;
      distribution: Array<{
        events_attended_bucket: string;
        people: number;
      }>;
    }>;
  };
}

export default function AnalyticsSummary() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData()
      .then((responseData) => {
        console.log("Dashboard Response:", responseData); 
        setData(responseData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }

  if (error || !data) {
    return <div className="text-center p-8 text-red-500">{error || "No data available"}</div>;
  }

  // Transform data for line chart (members over time)
  const lineChartData = data.overview.members_over_time.map(item => ({
    month: item.period,
    registered: item.registered_members_cumulative,
    active: item.active_members_cumulative
  }));

  // Transform data for pie chart (major category distribution)
  const pieChartData = data.mission.major_category_distribution.map(item => ({
    name: item.major_category,
    value: item.members
  }));

  // Transform data for stacked bar chart (class year distribution)
  const stackedBarData = data.mission.class_year_distribution.map(item => ({
    category: item.class_year,
    value: item.members
  }));

  // Transform data for horizontal bar chart (attendance distribution)
  const horizontalBarData = data.retention.attendance_count_distribution_overall.map(item => ({
    bucket: item.events_attended_bucket,
    people: item.people
  }));

  return (
    <div className="flex flex-col w-full gap-20">
      {/* KPI Row 1 */}
      <div className="flex w-full gap-20">
        <div className="flex-1">
          <BigNumber 
            title="Total Members"
            value={data.overview.kpis.total_members}
          />
        </div>
        <div className="flex-1">
          <BigNumber 
            title="Active Members"
            value={data.overview.kpis.active_members}
          />
        </div>
      </div>

      {/* KPI Row 2 */}
      <div className="flex w-full gap-20">
        <div className="flex-1">
          <BigNumber 
            title="Active Member %"
            value={`${(data.overview.kpis.active_member_pct * 100).toFixed(1)}%`}
          />
        </div>
        <div className="flex-1">
          <BigNumber 
            title="30-Day Growth"
            value={`${(data.overview.kpis.registered_growth_last_30d_pct * 100).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Line Chart - Members Over Time */}
      <div className="w-full">
        <ChartLineMultiple 
          data={lineChartData}
          title="Member Growth Over Time"
        />
      </div>
      
      {/* Pie Chart and Stacked Bar Chart */}
      <div className="w-full flex justify-center">
        <div className="flex gap-8 w-full">
          <div className="flex-[1] h-full">
            <ChartPieLabelList 
              data={pieChartData}
              title="Members by Major Category"
            />
          </div>
          <div className="flex-[2] h-full">
            <ChartBarStacked 
              data={stackedBarData}
              title="Members by Class Year"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart - Attendance Distribution */}
      <div className="w-full">
        <ChartBarHorizontal 
          data={horizontalBarData}
          title="Event Attendance Distribution"
        />
      </div>
    </div>
  );
}