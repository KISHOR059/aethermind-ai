import { z } from "zod";

export const prioritizedTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  recommendedPriority: z.number().int().min(1),
  reason: z.string().min(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedFocusMinutes: z.number().int().min(1),
});

export const taskPrioritizationResponseSchema = z.object({
  summary: z.string().min(1),
  prioritizedTasks: z.array(prioritizedTaskSchema),
  recommendations: z.array(z.string().min(1)),
});

export type PrioritizedTask = z.infer<typeof prioritizedTaskSchema>;
export type TaskPrioritizationResponse = z.infer<
  typeof taskPrioritizationResponseSchema
>;
