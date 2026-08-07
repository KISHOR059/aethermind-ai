export const NOTIFICATION_TYPES = ["TASK", "AI", "SYSTEM", "PRODUCTIVITY", "REMINDER"] as const;
export const NOTIFICATION_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
export type NotificationTypeFilter = NotificationType | "ALL";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  search?: string;
  sortBy?: "createdAt" | "priority" | "type";
  sortOrder?: "asc" | "desc";
};

export type NotificationListData = {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UnreadCountData = {
  count: number;
};
