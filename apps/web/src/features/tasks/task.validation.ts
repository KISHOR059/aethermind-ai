import { z } from "zod";

import { TASK_PRIORITIES } from "./task.types";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").optional(),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional(),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

