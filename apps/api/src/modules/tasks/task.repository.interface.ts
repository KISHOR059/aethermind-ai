import type { TaskDocument, TaskPriority, TaskStatus } from "./task.model.js";
import type { QueryOptions } from "../../shared/query/types.js";

export type CreateTaskData = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedMinutes?: number;
  tags: string[];
  completedAt?: Date;
};

export type UpdateTaskData = Partial<CreateTaskData>;

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
};

export type TaskSortField =
  | "createdAt"
  | "dueDate"
  | "title"
  | "priority"
  | "status";

export type TaskListQuery = QueryOptions<TaskFilters, TaskSortField>;

export type PaginatedTasks = {
  items: TaskDocument[];
  total: number;
};

export interface ITaskRepository {
  create(ownerId: string, data: CreateTaskData): Promise<TaskDocument>;
  findMany(ownerId: string, query: TaskListQuery): Promise<PaginatedTasks>;
  findById(ownerId: string, taskId: string): Promise<TaskDocument | null>;
  update(
    ownerId: string,
    taskId: string,
    data: UpdateTaskData,
  ): Promise<TaskDocument | null>;
  softDelete(ownerId: string, taskId: string): Promise<boolean>;
}
