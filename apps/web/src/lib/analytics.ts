
//API Wiring, fetch and recieve JSON

//nesting the objects according to the API contract
export interface AnalyticsDashboard {
    meta: { start: string; end: string };
  overview: {
    kpis: {
      total_members: number;
      active_members: number;
      active_member_pct: number; // Note: Julia's seed uses pct (singular)
      registered_growth_last_30d_pct: number;
    };
  };
  mission: {
    major_category_distribution: { major_category: string; members: number }[];
  };
}

}

export const fetchDashboardData = async (): Promise<AnalyticsDashboard> => {
    try{
        const response = await fetch("http://localhost:8000/analytics/dashboard"); //wait for update

        if (!response.ok) {
            throw new Error("Endpoint not found ");
        }

        const data = await response.json();
        console.log("Data fetched");
        return data;

    } catch(error){   //placeholder
        console.log("Mock Data:")

       return {
         overview: {
        kpis: {
          total_members: 150,
          active_members: 45,
          active_members_pct: 30.0,
          registered_growth_last_30d_pct: 5.2
        }
      }
    };
  }
};