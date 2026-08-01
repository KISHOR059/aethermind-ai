import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { taskService } from "./task.service";
import type { CreateTaskInput, Task, TaskListData, TaskListParams, UpdateTaskInput } from "./task.types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
};

export const defaultTaskParams: TaskListParams = { page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" };

export function useTasks(params: TaskListParams = defaultTaskParams) {
  return useQuery({ queryKey: taskKeys.list(params), queryFn: () => taskService.list(params) });
}

export function useTaskCounts() {
  const results = useQueries({
    queries: (["TODO", "IN_PROGRESS", "COMPLETED"] as const).map((status) => ({
      queryKey: taskKeys.list({ ...defaultTaskParams, status }),
      queryFn: () => taskService.list({ ...defaultTaskParams, status, limit: 1 }),
    })),
  });

  return {
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    todo: results[0]?.data?.pagination.total ?? 0,
    inProgress: results[1]?.data?.pagination.total ?? 0,
    completed: results[2]?.data?.pagination.total ?? 0,
  };
}

function updateCachedLists(queryClient: ReturnType<typeof useQueryClient>, update: (data: TaskListData) => TaskListData) {
  return queryClient.getQueriesData<TaskListData>({ queryKey: taskKeys.all }).map(([queryKey, data]) => {
    if (data) queryClient.setQueryData(queryKey, update(data));
    return [queryKey, data] as const;
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = updateCachedLists(queryClient, (data) => ({
        ...data,
        items: [{ ...input, id: `optimistic-${Date.now()}`, status: "TODO", tags: [], owner: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...data.items] as Task[],
        pagination: { ...data.pagination, total: data.pagination.total + 1 },
      }));
      return { snapshots };
    },
    onError: (_error, _input, context) => context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => taskService.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = updateCachedLists(queryClient, (data) => ({ ...data, items: data.items.map((task) => task.id === id ? { ...task, ...input } : task) }));
      return { snapshots };
    },
    onError: (_error, _input, context) => context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = updateCachedLists(queryClient, (data) => ({ ...data, items: data.items.filter((task) => task.id !== id), pagination: { ...data.pagination, total: Math.max(0, data.pagination.total - 1) } }));
      return { snapshots };
    },
    onError: (_error, _input, context) => context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
