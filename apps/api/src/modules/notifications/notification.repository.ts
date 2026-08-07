import { NotificationModel } from "./notification.model.js";
import type {
  CreateNotificationData,
  INotificationRepository,
  NotificationListQuery,
  PaginatedNotifications,
  UpdateNotificationData,
} from "./notification.repository.interface.js";
import type { NotificationDocument } from "./notification.model.js";
import { MongooseQueryBuilder } from "../../shared/query/index.js";

export class NotificationRepository implements INotificationRepository {
  public async create(
    userId: string,
    data: CreateNotificationData,
  ): Promise<NotificationDocument> {
    return NotificationModel.create({
      ...data,
      userId,
    });
  }

  public async findMany(
    userId: string,
    query: NotificationListQuery,
  ): Promise<PaginatedNotifications> {
    const builder = new MongooseQueryBuilder(NotificationModel, {
      userId,
    });

    const queryBuilder = builder
      .filters(query.filters)
      .search(["title", "message"], query.search)
      .sort(query.sort)
      .paginate(query.pagination);

    const [items, total] = await Promise.all([
      queryBuilder.exec(),
      queryBuilder.count(),
    ]);

    return { items, total };
  }

  public async findById(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDocument | null> {
    return NotificationModel.findOne({
      _id: notificationId,
      userId,
    }).exec();
  }

  public async update(
    userId: string,
    notificationId: string,
    data: UpdateNotificationData,
  ): Promise<NotificationDocument | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: data },
      { new: true, runValidators: true },
    ).exec();
  }

  public async delete(userId: string, notificationId: string): Promise<boolean> {
    const result = await NotificationModel.deleteOne({
      _id: notificationId,
      userId,
    }).exec();

    return result.deletedCount === 1;
  }

  public async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    const result = await NotificationModel.updateOne(
      { _id: notificationId, userId, isRead: false },
      { $set: { isRead: true } },
    ).exec();

    return result.modifiedCount === 1;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    ).exec();

    return result.modifiedCount;
  }

  public async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({
      userId,
      isRead: false,
    }).exec();
  }
}
