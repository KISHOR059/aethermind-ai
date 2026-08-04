import type { ApiSuccess } from "@/shared/types/api";
import apiClient from "@/shared/lib/api-client";

import type {
  PlanDayResult,
  SmartRescheduleResult,
  TaskBreakdownResult,
  TaskPrioritizationResult,
  WeeklyReviewResult,
} from "./ai.types";

/**
 * Extended timeout (120 seconds) for AI endpoints.
 * Local LLM inference (e.g., Ollama llama3.2:3b) requires 25–40 seconds
 * to process prompts and generate validated JSON plans. This constant
 * ensures AI requests are not prematurely aborted by Axios, unlike standard
 * millisecond CRUD operations.
 *
 * Exported for easy reuse across present and future AI endpoints:
 * - /ai/plan-day
 * - /ai/tasks/:taskId/breakdown
 * - /ai/prioritize
 * - /ai/reschedule
 * - /ai/weekly-review
 * - /ai/summarize
 * - /ai/chat
 */
export const AI_REQUEST_TIMEOUT_MS = 120_000;

export const aiService = {
  planDay: async () => {
    const response = await apiClient.post<ApiSuccess<PlanDayResult>>(
      "/ai/plan-day",
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    return response.data.data;
  },

  breakDownTask: async (taskId: string) => {
    const response = await apiClient.post<ApiSuccess<TaskBreakdownResult>>(
      `/ai/tasks/${taskId}/breakdown`,
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    return response.data.data;
  },

  prioritizeTasks: async () => {
    const response = await apiClient.post<
      ApiSuccess<TaskPrioritizationResult>
    >(
      "/ai/prioritize",
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    return response.data.data;
  },

  smartReschedule: async () => {
    const response = await apiClient.post<ApiSuccess<SmartRescheduleResult>>(
      "/ai/reschedule",
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    return response.data.data;
  },

  weeklyReview: async () => {
    const response = await apiClient.post<ApiSuccess<WeeklyReviewResult>>(
      "/ai/weekly-review",
      {},
      {
        timeout: AI_REQUEST_TIMEOUT_MS,
      },
    );

    return response.data.data;
  },
};

