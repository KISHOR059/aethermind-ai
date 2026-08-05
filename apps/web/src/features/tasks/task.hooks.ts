import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { taskService } from "./task.service";
import type { CreateTaskInput, Task, TaskListData, TaskListParams, UpdateTaskInput } from "./task.types";
import { invalidateWorkspaceTaskQueries } from "@/shared/lib/query.utils";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
};

export const defaultTaskParams: TaskListParams = { page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" };

export function useTasks(params: TaskListParams = defaultTaskParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: ({ signal }) => taskService.list(params, signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useTaskCounts() {
  const allTasksQuery = useQuery({
    queryKey: taskKeys.list({ ...defaultTaskParams, page: 1, limit: 1 }),
    queryFn: () => taskService.list({ ...defaultTaskParams, page: 1, limit: 1 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const countQueries = useQueries({
    queries: [
      {
        queryKey: taskKeys.list({ ...defaultTaskParams, status: "TODO", page: 1, limit: 1 }),
        queryFn: () => taskService.list({ ...defaultTaskParams, status: "TODO", page: 1, limit: 1 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: taskKeys.list({ ...defaultTaskParams, status: "IN_PROGRESS", page: 1, limit: 1 }),
        queryFn: () => taskService.list({ ...defaultTaskParams, status: "IN_PROGRESS", page: 1, limit: 1 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: taskKeys.list({ ...defaultTaskParams, status: "COMPLETED", page: 1, limit: 1 }),
        queryFn: () => taskService.list({ ...defaultTaskParams, status: "COMPLETED", page: 1, limit: 1 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: taskKeys.list({ ...defaultTaskParams, overdue: true, page: 1, limit: 1 }),
        queryFn: () => taskService.list({ ...defaultTaskParams, overdue: true, page: 1, limit: 1 }),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    ],
  });

  const [todoQuery, inProgressQuery, completedQuery, overdueQuery] = countQueries;

  return {
    isLoading: allTasksQuery.isLoading || countQueries.some((result) => result.isLoading),
    isError: allTasksQuery.isError || countQueries.some((result) => result.isError),
    total: allTasksQuery.data?.pagination.total ?? 0,
    todo: todoQuery?.data?.pagination.total ?? 0,
    inProgress: inProgressQuery?.data?.pagination.total ?? 0,
    completed: completedQuery?.data?.pagination.total ?? 0,
    overdue: overdueQuery?.data?.pagination.total ?? 0,
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
    onSettled: () => void invalidateWorkspaceTaskQueries(queryClient),
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
    onSettled: () => void invalidateWorkspaceTaskQueries(queryClient),
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
    onSettled: () => void invalidateWorkspaceTaskQueries(queryClient),
  });
}
