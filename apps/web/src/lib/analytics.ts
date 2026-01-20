

/**
 * Fetches aggregated analytics data from FastAPI backend
 */
interface AnalyticsData {
  overview: any;
  retention: any;
  mission: any;
}

export const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  try {
    const response = await fetch("http://localhost:8000/analytics/retention", { //endpoint
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnalyticsData = await response.json();
    console.log("data fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};


export const fetchDashboardData = fetchAnalyticsData;