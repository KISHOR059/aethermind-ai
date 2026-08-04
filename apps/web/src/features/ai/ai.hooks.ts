import { useQuery } from "@tanstack/react-query";

import { aiService } from "./ai.service";

export const aiKeys = {
  planDay: ["ai", "plan-day"] as const,
  taskBreakdown: (taskId: string) => ["ai", "task-breakdown", taskId] as const,
  prioritizeTasks: ["ai", "prioritize"] as const,
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

export function useTaskBreakdown(taskId: string) {
  return useQuery({
    queryKey: aiKeys.taskBreakdown(taskId),
    queryFn: () => aiService.breakDownTask(taskId),
    enabled: false,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  });
}

export function usePrioritizeTasks() {
  return useQuery({
    queryKey: aiKeys.prioritizeTasks,
    queryFn: aiService.prioritizeTasks,
    enabled: false,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  });
}


