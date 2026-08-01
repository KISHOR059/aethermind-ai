import { z } from "zod";

export const dailyPlannerResponseSchema = z.object({
  summary: z.string(),
  priorities: z.array(z.string()),
  schedule: z.array(
    z.object({
      time: z.string(),
      task: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
  productivityScore: z.number().min(0).max(100),
});

export type DailyPlannerResponse = z.infer<
  typeof dailyPlannerResponseSchema
>;
