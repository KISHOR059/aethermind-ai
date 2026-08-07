import axios from "axios";

import apiClient, { ApiError } from "@/shared/lib/api-client";
import type { ApiSuccess } from "@/shared/types/api";

import type { Notification, NotificationListData, NotificationListParams, UnreadCountData } from "./notification.types";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data.message ?? "Request failed";
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

export const notificationService = {
  list: (params?: NotificationListParams, signal?: AbortSignal) =>
    request(apiClient.get<ApiSuccess<NotificationListData>>("/notifications", { params, signal })),

  unreadCount: (signal?: AbortSignal) =>
    request(apiClient.get<ApiSuccess<UnreadCountData>>("/notifications/unread-count", { signal })),

  markAsRead: (id: string) =>
    request(apiClient.patch<ApiSuccess<Notification>>(`/notifications/${id}/read`)),

  markAllAsRead: () =>
    request(apiClient.patch<ApiSuccess<{ modifiedCount: number }>>("/notifications/read-all")),

  remove: (id: string) =>
    request(apiClient.delete<ApiSuccess<null>>(`/notifications/${id}`)),
};
