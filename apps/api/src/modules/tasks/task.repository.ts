import type { QueryFilter } from "mongoose";

import { TaskModel, type Task } from "./task.model.js";
import type {
  CreateTaskData,
  ITaskRepository,
  PaginatedTasks,
  TaskListQuery,
  UpdateTaskData,
} from "./task.repository.interface.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class TaskRepository implements ITaskRepository {
  public async create(ownerId: string, data: CreateTaskData) {
    return TaskModel.create({ ...data, owner: ownerId });
  }

  public async findMany(ownerId: string, query: TaskListQuery): Promise<PaginatedTasks> {
    const filter: QueryFilter<Task> = {
      owner: ownerId,
      deletedAt: null,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.search) {
      const search = escapeRegex(query.search);
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const direction: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;
    const sort = { [query.sortBy]: direction };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      TaskModel.find(filter).sort(sort).skip(skip).limit(query.limit).exec(),
      TaskModel.countDocuments(filter).exec(),
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
