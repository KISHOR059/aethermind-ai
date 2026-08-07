import { TaskModel, TaskStatus } from "./task.model.js";
import { MongooseQueryBuilder } from "../../shared/query/index.js";
import type {
  CreateTaskData,
  ITaskRepository,
  PaginatedTasks,
  TaskListQuery,
  UpdateTaskData,
} from "./task.repository.interface.js";

export class TaskRepository implements ITaskRepository {
  public async create(ownerId: string, data: CreateTaskData) {
    return TaskModel.create({
      ...data,
      owner: ownerId,
      estimatedMinutes: data.estimatedMinutes ?? undefined,
    });
  }

  public async findMany(ownerId: string, query: TaskListQuery): Promise<PaginatedTasks> {
    const builder = new MongooseQueryBuilder(TaskModel, {
      owner: ownerId,
      deletedAt: null,
    });

    const filters = { ...query.filters };

    if (filters.overdue) {
      const overdueFilter = {
        dueDate: { $lt: new Date() },
        status: { $ne: TaskStatus.COMPLETED },
      } as const;
      delete filters.overdue;
      builder.filters(overdueFilter);
    }

    const queryBuilder = builder
      .filters(filters)
      .search(["title", "description", "tags"], query.search)
      .sort(query.sort)
      .paginate(query.pagination);

    const [items, total] = await Promise.all([
      queryBuilder.exec(),
      queryBuilder.count(),
    ]);

    return { items, total };
  }

  public async findById(ownerId: string, taskId: string) {
    return TaskModel.findOne({ _id: taskId, owner: ownerId, deletedAt: null }).exec();
  }

  public async update(ownerId: string, taskId: string, data: UpdateTaskData) {
    return TaskModel.findOneAndUpdate(
      { _id: taskId, owner: ownerId, deletedAt: null },
      { $set: data },
      { new: true, runValidators: true },
    ).exec();
  }

  public async softDelete(ownerId: string, taskId: string): Promise<boolean> {
    const result = await TaskModel.updateOne(
      { _id: taskId, owner: ownerId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    ).exec();

    return result.modifiedCount === 1;
  }
}
