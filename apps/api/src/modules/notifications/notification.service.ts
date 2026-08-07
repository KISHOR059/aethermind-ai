import { NotFoundError } from "../../utils/app-error.js";
import type {
  CreateNotificationData,
  INotificationRepository,
  NotificationListQuery,
} from "./notification.repository.interface.js";
import type { NotificationDocument } from "./notification.model.js";
import type {
  NotificationPriority,
  NotificationType,
} from "./notification.types.js";

export type PublicNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicNotification(doc: NotificationDocument): PublicNotification {
  return {
    id: doc._id.toString(),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    priority: doc.priority,
    isRead: doc.isRead,
    actionUrl: doc.actionUrl,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class NotificationService {
  public constructor(private readonly repository: INotificationRepository) {}

  public async create(
    userId: string,
    data: CreateNotificationData,
  ): Promise<PublicNotification> {
    const notification = await this.repository.create(userId, data);
    return toPublicNotification(notification);
  }

  public async list(
    userId: string,
    query: NotificationListQuery,
  ): Promise<{ items: PublicNotification[]; total: number }> {
    const result = await this.repository.findMany(userId, query);
    return {
      items: result.items.map(toPublicNotification),
      total: result.total,
    };
  }

  public async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<PublicNotification> {
    const notification = await this.repository.findById(userId, notificationId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    await this.repository.markAsRead(userId, notificationId);

    notification.isRead = true;
    return toPublicNotification(notification);
  }

  public async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const modifiedCount = await this.repository.markAllAsRead(userId);
    return { modifiedCount };
  }

  public async delete(userId: string, notificationId: string): Promise<void> {
    const deleted = await this.repository.delete(userId, notificationId);

    if (!deleted) {
      throw new NotFoundError("Notification not found");
    }
  }

  public async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repository.countUnread(userId);
    return { count };
  }
}
