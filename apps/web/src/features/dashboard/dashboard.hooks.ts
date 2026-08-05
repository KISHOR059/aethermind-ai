import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "./dashboard.service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: ["dashboard", "stats"] as const,
  productivityInsights: ["ai", "productivity-insights"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: dashboardService.getStats,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useProductivityInsights() {
  return useQuery({
    queryKey: dashboardKeys.productivityInsights,
    queryFn: dashboardService.getProductivityInsights,
    enabled: false,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
