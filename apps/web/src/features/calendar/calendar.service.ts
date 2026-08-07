import axios from "axios";

import apiClient, { ApiError } from "@/shared/lib/api-client";
import type { ApiSuccess } from "@/shared/types/api";

import type {
  CalendarEventsResult,
  CalendarRescheduleInput,
  CalendarRescheduleResult,
} from "./calendar.types";
import type { TaskPriority, TaskStatus } from "@/features/tasks/task.types";

export type CalendarQueryParams = {
  startDate?: string;
  endDate?: string;
  view?: "month" | "week" | "day";
  status?: TaskStatus;
  priority?: TaskPriority;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error))
    return error.response?.data.message ?? "Request failed";
  return error instanceof Error ? error.message : "Request failed";
}

async function request<T>(promise: Promise<{ data: ApiSuccess<T> }>) {
  try {
    return (await promise).data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(getErrorMessage(error), { cause: error });
  }
}

export const calendarService = {
  getEvents: (params: CalendarQueryParams, signal?: AbortSignal) =>
    request(
      apiClient.get<ApiSuccess<CalendarEventsResult>>("/calendar", {
        params,
        signal,
      }),
    ),
  reschedule: (input: CalendarRescheduleInput) =>
    request(
      apiClient.post<ApiSuccess<CalendarRescheduleResult>>(
        "/calendar/reschedule",
        input,
      ),
    ),
};
