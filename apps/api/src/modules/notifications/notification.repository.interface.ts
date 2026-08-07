import type { QueryOptions } from "../../shared/query/types.js";
import type { NotificationDocument } from "./notification.model.js";
import type {
  NotificationPriority,
  NotificationType,
} from "./notification.types.js";

export type CreateNotificationData = {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateNotificationData = Partial<CreateNotificationData> & {
  isRead?: boolean;
};

export type NotificationFilters = {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
};

export type NotificationSortField = "createdAt" | "priority" | "type";

export type NotificationListQuery = QueryOptions<
  NotificationFilters,
  NotificationSortField
>;

export type PaginatedNotifications = {
  items: NotificationDocument[];
  total: number;
};

export interface INotificationRepository {
  create(
    userId: string,
    data: CreateNotificationData,
  ): Promise<NotificationDocument>;

  findMany(
    userId: string,
    query: NotificationListQuery,
  ): Promise<PaginatedNotifications>;

  findById(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDocument | null>;

  update(
    userId: string,
    notificationId: string,
    data: UpdateNotificationData,
  ): Promise<NotificationDocument | null>;

  delete(userId: string, notificationId: string): Promise<boolean>;

  markAsRead(userId: string, notificationId: string): Promise<boolean>;

  markAllAsRead(userId: string): Promise<number>;

  countUnread(userId: string): Promise<number>;
}
