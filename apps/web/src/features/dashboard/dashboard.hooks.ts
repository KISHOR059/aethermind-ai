import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "./dashboard.service";

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
  productivityInsights: ["ai", "productivity-insights"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: dashboardService.getStats,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useProductivityInsights() {
  return useQuery({
    queryKey: dashboardKeys.productivityInsights,
    queryFn: dashboardService.getProductivityInsights,
    enabled: false,
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
  });
}
