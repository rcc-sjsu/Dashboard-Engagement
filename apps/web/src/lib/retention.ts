import { authenticatedFetch } from "./api-client";

interface RetentionData {
  retention: any;
}

export const fetchRetentionData = async (): Promise<RetentionData> => {
  try {
    const response = await authenticatedFetch("/api/analytics/retention", {
      method: "GET",
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
