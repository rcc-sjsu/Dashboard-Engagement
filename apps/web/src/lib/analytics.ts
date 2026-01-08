
//API Wiring, fetch and recieve JSON

//according to analytics/dashboard (seed data)
export interface AnalyticsDashboard { //obj shape
    meta: { start: string; end: string };
  overview: {
    kpis: {
      total_members: number;
      active_members: number;
      active_member_pct: number; 
      registered_growth_last_30d_pct: number;
    };
  };
  mission: {
    major_category_distribution: { major_category: string; members: number }[];
  };
}



export const fetchDashboardData = async () => {
    try{
        const response = await fetch("http://localhost:8000/analytics"); //wait for update


        const data = await response.json();
        console.log("Data fetched");
        return data;

    } catch(error){   //placeholder
        console.log("Mock Data:")

       return (
         error
      )
    
  }
};