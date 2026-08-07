import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NotificationListData, NotificationListParams } from "./notification.types";
import { notificationService } from "./notification.service";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationListParams) => ["notifications", "list", params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

const NOTIFICATION_POLL_INTERVAL = 45_000;

const notificationListKeys = ["notifications", "list"] as const;

function updateCachedNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (current: NotificationListData) => NotificationListData,
) {
  const queries = queryClient.getQueriesData<NotificationListData>({
    queryKey: notificationListKeys,
  });
  queries.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, updater(data));
  });
}

function snapshotAllNotificationCaches(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueriesData<NotificationListData>({
    queryKey: notificationListKeys,
  }) as [queryKey: readonly unknown[], data: NotificationListData | undefined][];
}

function restoreNotificationCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: [queryKey: readonly unknown[], data: NotificationListData | undefined][],
) {
  snapshots.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, data);
  });
}

export function useNotifications(params?: NotificationListParams) {
  const mergedParams: NotificationListParams = { limit: 50, ...params };

  return useQuery({
    queryKey: notificationKeys.list(mergedParams),
    queryFn: ({ signal }) => notificationService.list(mergedParams, signal),
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    staleTime: 0,
    gcTime: 2 * 60_000,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const snapshots = snapshotAllNotificationCaches(queryClient);

      updateCachedNotifications(queryClient, (data) => ({
        ...data,
        items: data.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      }));

      const prevCount = queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount());
      if (prevCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), { count: Math.max(0, prevCount.count - 1) });
      }

      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context?.snapshots) restoreNotificationCaches(queryClient, context.snapshots);
      toast.error("Failed to mark notification as read");
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
      const snapshots = snapshotAllNotificationCaches(queryClient);

      updateCachedNotifications(queryClient, (data) => ({
        ...data,
        items: data.items.map((item) => ({ ...item, isRead: true })),
      }));
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 });

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshots) restoreNotificationCaches(queryClient, context.snapshots);
      toast.error("Failed to mark all as read");
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
      const snapshots = snapshotAllNotificationCaches(queryClient);

      const target = queryClient.getQueriesData<NotificationListData>({ queryKey: notificationListKeys })
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

      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context?.snapshots) restoreNotificationCaches(queryClient, context.snapshots);
      toast.error("Failed to delete notification");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
