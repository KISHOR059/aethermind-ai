import type { AIExecutionMetrics } from "../ai/ai.types";

export type PriorityDistribution = {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  URGENT: number;
};

export type WeeklyTrendItem = {
  day: string;
  completed: number;
  pending: number;
};

export type DailyProductivityItem = {
  date: string;
  count: number;
  minutes: number;
};

export type DashboardStatistics = {
  totalTasks: number;
  createdTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
  tasksFinishedToday: number;
  completionRate: number;
  averageTasksPerDay: number;
  averageEstimatedMinutes: number;
  completedMinutes: number;
  estimatedHoursWorked: number;
  currentStreak: number;
  longestStreak: number;
  mostProductiveDay: string;
  mostProductiveWeekday: string;
  productivityScore: number;
  taskPriorityDistribution: PriorityDistribution;
  weeklyTrend: WeeklyTrendItem[];
  statusDistribution: {
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  };
  dailyProductivity: DailyProductivityItem[];
};

export type ProductivityInsightsStatistics = {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  mostProductiveDay: string;
  estimatedHoursWorked: number;
};

export type ProductivityInsights = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  recommendations: string[];
  statistics: ProductivityInsightsStatistics;
  productivityScore: number;
};

export type ProductivityInsightsResult = {
  data: ProductivityInsights;
  metrics: AIExecutionMetrics;
};
