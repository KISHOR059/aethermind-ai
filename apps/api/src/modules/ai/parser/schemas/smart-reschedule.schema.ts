import { z } from "zod";

export const rescheduledItemSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  time: z.string().min(1),
  estimatedMinutes: z.number().int().min(1),
  reason: z.string().min(1),
});

export const movedTaskSchema = z.object({
  taskId: z.string().min(1),
  oldDate: z.string().min(1),
  newDate: z.string().min(1),
  reason: z.string().min(1),
});

export const smartRescheduleResponseSchema = z.object({
  summary: z.string().min(1),
  schedule: z.array(rescheduledItemSchema),
  movedTasks: z.array(movedTaskSchema),
  recommendations: z.array(z.string().min(1)),
  productivityScore: z.number().int().min(0).max(100),
});

export type RescheduledItem = z.infer<typeof rescheduledItemSchema>;
export type MovedTask = z.infer<typeof movedTaskSchema>;
export type SmartRescheduleResponse = z.infer<
  typeof smartRescheduleResponseSchema
>;
