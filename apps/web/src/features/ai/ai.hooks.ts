import { useQuery } from "@tanstack/react-query";

import { aiService } from "./ai.service";

export const aiKeys = {
  planDay: ["ai", "plan-day"] as const,
};

export function usePlanDay() {
  return useQuery({
    queryKey: aiKeys.planDay,
    queryFn: aiService.planDay,
    enabled: false,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  });
}
