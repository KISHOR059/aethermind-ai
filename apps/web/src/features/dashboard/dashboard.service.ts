import type { ApiSuccess } from "@/shared/types/api";
import apiClient from "@/shared/lib/api-client";
import { AI_REQUEST_TIMEOUT_MS } from "../ai/ai.service";
import type {
  DashboardStatistics,
  ProductivityInsightsResult,
} from "./dashboard.types";

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get<ApiSuccess<DashboardStatistics>>(
      "/dashboard/stats",
    );
    return response.data.data;
  },

  getProductivityInsights: async () => {
    const response = await apiClient.post<
      ApiSuccess<ProductivityInsightsResult>
    >(
      "/ai/productivity-insights",
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );
    return response.data.data;
  },
};
