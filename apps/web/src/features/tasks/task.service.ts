import axios from "axios";

import apiClient, { ApiError } from "@/shared/lib/api-client";
import type { ApiSuccess } from "@/shared/types/api";

import type { CreateTaskInput, Task, TaskListData, TaskListParams, UpdateTaskInput } from "./task.types";

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

export const taskService = {
  list: (params?: TaskListParams, signal?: AbortSignal) => request(apiClient.get<ApiSuccess<TaskListData>>("/tasks", { params, signal })),
  create: (input: CreateTaskInput) => request(apiClient.post<ApiSuccess<Task>>("/tasks", input)),
  update: (id: string, input: UpdateTaskInput) => request(apiClient.patch<ApiSuccess<Task>>(`/tasks/${id}`, input)),
  remove: (id: string) => request(apiClient.delete<ApiSuccess<null>>(`/tasks/${id}`)),
};
