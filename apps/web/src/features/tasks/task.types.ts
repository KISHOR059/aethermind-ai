export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  estimatedMinutes?: number;
  completedAt?: string;
  tags: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: "createdAt" | "dueDate" | "title" | "priority" | "status";
  sortOrder?: "asc" | "desc";
};

export type TaskListData = {
  items: Task[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  estimatedMinutes?: number;
  tags?: string[];
};
export type UpdateTaskInput = Partial<Pick<Task, "title" | "description" | "status" | "priority" | "dueDate" | "estimatedMinutes">>;


