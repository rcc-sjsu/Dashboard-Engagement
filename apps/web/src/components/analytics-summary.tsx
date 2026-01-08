'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData, type AnalyticsDashboard } from '@/lib/analytics';


export default function AnalyticsSummary() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
  fetchDashboardData().then((data) => {
    console.log("Dashboard Response:", data); 
    setStats(data);
  });
}, []);

  if(stats == null){
    return <div>Loading stats...</div>;
  }

    return (
    <div>
      <h2 className="text-xl font-bold">Dashboard Stats</h2>
       <pre> {JSON.stringify(stats)} </pre>
      {/* <ul>
        
        <li>Total Members: {stats.overview.kpis.total_members}</li>
        <li>Active Members: {stats.overview.kpis.active_members}</li>
        <li>Growth: {stats.overview.kpis.registered_growth_last_30d_pct}%</li>

      </ul>     */}
    </div>
  );
}

//export default AnalyticsSummary;