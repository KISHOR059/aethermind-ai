import type { TaskDocument, TaskPriority, TaskStatus } from "./task.model.js";

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

export type TaskListQuery = {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  sortBy: "createdAt" | "dueDate" | "title" | "priority" | "status";
  sortOrder: "asc" | "desc";
};

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
