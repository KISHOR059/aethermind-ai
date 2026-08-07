import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationListData, NotificationListParams } from "./notification.types";
import { notificationService } from "./notification.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

function updateCachedNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (current: NotificationListData) => NotificationListData,
) {
  const queries = queryClient.getQueriesData<NotificationListData>({
    queryKey: notificationKeys.all,
  });
  queries.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, updater(data));
  });
}

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ signal }) => notificationService.list({ limit: 50, ...params }, signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationListData>({ queryKey: notificationKeys.all });
      updateCachedNotifications(queryClient, (data) => ({
        ...data,
        items: data.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      }));
      const prevCount = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount());
      if (prevCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), { count: Math.max(0, prevCount.count - 1) });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationListData>({ queryKey: notificationKeys.all });
      updateCachedNotifications(queryClient, (data) => ({
        ...data,
        items: data.items.map((item) => ({ ...item, isRead: true })),
      }));
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueriesData<NotificationListData>({ queryKey: notificationKeys.all });
      const target = queryClient.getQueriesData<NotificationListData>({ queryKey: notificationKeys.all })
        .find(([, data]) => data?.items.some((item) => item.id === id))?.[1];
      const wasUnread = target?.items.find((item) => item.id === id)?.isRead === false;
      updateCachedNotifications(queryClient, (data) => ({
        ...data,
        items: data.items.filter((item) => item.id !== id),
        pagination: { ...data.pagination, total: Math.max(0, data.pagination.total - 1) },
      }));
      if (wasUnread) {
        const prevCount = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount());
        if (prevCount) {
          queryClient.setQueryData(notificationKeys.unreadCount(), { count: Math.max(0, prevCount.count - 1) });
        }
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
