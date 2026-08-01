import type { ApiSuccess } from "@/shared/types/api";
import apiClient from "@/shared/lib/api-client";

import type { PlanDayResult } from "./ai.types";

export const aiService = {
  planDay: async () => {
    const response = await apiClient.post<ApiSuccess<PlanDayResult>>(
      "/ai/plan-day",
    );

    return response.data.data;
  },
};
