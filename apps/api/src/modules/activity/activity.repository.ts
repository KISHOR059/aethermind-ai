import { ActivityLogModel, type ActivityLogDocument } from "./activity.model.js";

export interface CreateActivityLogData {
  ownerId: string;
  taskId: string;
  taskTitle: string;
  action: "created" | "updated" | "completed" | "deleted";
  metadata?: Record<string, unknown>;
}

export interface ActivityLogListQuery {
  pagination: { page: number; limit: number; skip: number };
}

export interface PaginatedActivityLogs {
  items: ActivityLogDocument[];
  total: number;
}

export class ActivityRepository {
  public async create(data: CreateActivityLogData): Promise<ActivityLogDocument> {
    return ActivityLogModel.create({
      owner: data.ownerId,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      action: data.action,
      metadata: data.metadata,
    });
  }

  public async findMany(
    ownerId: string,
    query: ActivityLogListQuery,
  ): Promise<PaginatedActivityLogs> {
    const { pagination } = query;

    const [items, total] = await Promise.all([
      ActivityLogModel.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      ActivityLogModel.countDocuments({ owner: ownerId }).exec(),
    ]);

    return { items, total };
  }
}
