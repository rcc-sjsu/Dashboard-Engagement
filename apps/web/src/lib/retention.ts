/**
 * Fetches retention analytics data from FastAPI backend
 */

interface RetentionData {
  retention: any;
}

export const fetchRetentionData = async (): Promise<RetentionData> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/analytics/retention`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RetentionData = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching retention data:", error);
    throw error;
  }
};
