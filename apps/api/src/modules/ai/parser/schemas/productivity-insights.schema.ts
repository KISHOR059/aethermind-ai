import { z } from "zod";

export const productivityInsightsStatisticsSchema = z.object({
  completionRate: z.number().int().min(0).max(100),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  mostProductiveDay: z.string().min(1),
  estimatedHoursWorked: z.number().min(0),
});

export const productivityInsightsResponseSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  patterns: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
  statistics: productivityInsightsStatisticsSchema,
  productivityScore: z.number().int().min(0).max(100),
});

export type ProductivityInsightsStatistics = z.infer<
  typeof productivityInsightsStatisticsSchema
>;
export type ProductivityInsightsResponse = z.infer<
  typeof productivityInsightsResponseSchema
>;
