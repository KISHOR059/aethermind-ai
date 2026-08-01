import { z } from "zod";

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

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z
    .enum(["createdAt", "dueDate", "title", "priority", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
