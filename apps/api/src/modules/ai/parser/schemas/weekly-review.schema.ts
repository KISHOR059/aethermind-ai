import { z } from "zod";

export const weeklyStatisticsSchema = z.object({
  completedTasks: z.number().int().min(0),
  pendingTasks: z.number().int().min(0),
  overdueTasks: z.number().int().min(0),
  completionRate: z.number().int().min(0).max(100),
  estimatedMinutesWorked: z.number().int().min(0),
});

export const weeklyReviewResponseSchema = z.object({
  summary: z.string().min(1),
  achievements: z.array(z.string().min(1)),
  insights: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  statistics: weeklyStatisticsSchema,
  productivityScore: z.number().int().min(0).max(100),
});

export type WeeklyStatistics = z.infer<typeof weeklyStatisticsSchema>;
export type WeeklyReviewResponse = z.infer<typeof weeklyReviewResponseSchema>;
