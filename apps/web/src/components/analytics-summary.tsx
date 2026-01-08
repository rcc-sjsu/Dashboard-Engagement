'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData, type AnalyticsDashboard } from '@/lib/analytics';


export default function AnalyticsSummary() {
  const [stats, setStats] = useState<AnalyticsDashboard | null>(null);

  useEffect(() => {
    fetchDashboardData().then(setStats);
  }, []);

  if(stats == null){
    return <div>Loading stats...</div>;
  }

    return (
    <div>
      <h2 className="text-xl font-bold">Dashboard Stats</h2>
      <ul>
        {/* Notice we added .overview.kpis to get to the data! */}
        <li>Total Members: {stats.overview.kpis.total_members}</li>
        <li>Active Members: {stats.overview.kpis.active_members}</li>
        <li>Growth: {stats.overview.kpis.registered_growth_last_30d_pct}%</li>
      </ul>    
    </div>
  );
}

//export default AnalyticsSummary;