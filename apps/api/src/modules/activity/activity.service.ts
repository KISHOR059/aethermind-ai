import { ActivityRepository, type CreateActivityLogData } from "./activity.repository.js";

export type PublicActivityLog = {
  id: string;
  taskId: string;
  taskTitle: string;
  action: "created" | "updated" | "completed" | "deleted";
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

function toPublicActivityLog(doc: { _id: { toString(): string }; taskId: string; taskTitle: string; action: "created" | "updated" | "completed" | "deleted"; metadata?: Record<string, unknown>; createdAt: Date }): PublicActivityLog {
  return {
    id: doc._id.toString(),
    taskId: doc.taskId,
    taskTitle: doc.taskTitle,
    action: doc.action,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

export class ActivityService {
  public constructor(private readonly repository: ActivityRepository = new ActivityRepository()) {}

  public async logActivity(data: CreateActivityLogData): Promise<void> {
    await this.repository.create(data);
  }

  public async getActivityFeed(
    ownerId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: PublicActivityLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);

    const result = await this.repository.findMany(ownerId, {
      pagination: { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit },
    });

    return {
      items: result.items.map(toPublicActivityLog),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / safeLimit),
      },
    };
  }
}

export const activityService = new ActivityService();
