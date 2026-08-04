import { z } from "zod";

export const taskBreakdownSubtaskSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(""),
  priority: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    )
    .default("MEDIUM"),
  estimatedMinutes: z
    .preprocess(
      (val) => (typeof val === "string" ? Number(val) : val),
      z.number().positive(),
    )
    .optional()
    .default(30),
});

export const taskBreakdownResponseSchema = z.object({
  summary: z.string(),
  estimatedMinutes: z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z.number().nonnegative(),
  ),
  subtasks: z.array(taskBreakdownSubtaskSchema).min(1),
});

export type TaskBreakdownSubtask = z.infer<typeof taskBreakdownSubtaskSchema>;
export type TaskBreakdownResponse = z.infer<
  typeof taskBreakdownResponseSchema
>;
