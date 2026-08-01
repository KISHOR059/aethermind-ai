import { z } from "zod";

import {
  paginationQuerySchema,
  parseFilters,
  parsePagination,
  parseSearch,
  parseSort,
} from "../../shared/query/index.js";
import { TaskPriority, TaskStatus } from "./task.model.js";

const dateSchema = z.coerce.date().optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  status: z.enum(TaskStatus).default(TaskStatus.TODO),
  priority: z.enum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: dateSchema,
  startDate: dateSchema,
  estimatedMinutes: z.coerce.number().int().min(1).max(100_000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

const taskSortFields = [
  "createdAt",
  "dueDate",
  "title",
  "priority",
  "status",
] as const;

export const taskListQuerySchema = z
  .object({
    ...paginationQuerySchema.shape,
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .transform((input) => ({
    pagination: parsePagination(input),
    sort: parseSort(input, taskSortFields, "createdAt"),
    search: parseSearch(input.search),
    filters: parseFilters({
      status: input.status,
      priority: input.priority,
    }),
  }));

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
