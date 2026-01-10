'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData } from '@/lib/analytics';


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

    return ( <div>
    </div>
  );
}

//export default AnalyticsSummary;