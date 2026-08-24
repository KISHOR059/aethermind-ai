import { z } from "zod";

export const taskActionSchema = z.object({
  action: z.enum(["CREATE", "UPDATE", "NONE"]).default("NONE"),
  title: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimatedMinutes: z.number().optional(),
});

export const assistantChatResponseSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(5, "Assistant reply must contain meaningful text"),
  suggestedActions: z.array(z.string()).default([]),
  taskAction: taskActionSchema.optional().nullable(),
});

export type TaskAction = z.infer<typeof taskActionSchema>;
export type AssistantChatResponse = z.infer<typeof assistantChatResponseSchema>;
