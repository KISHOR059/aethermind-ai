export type DailyPlan = {
  summary: string;
  priorities: string[];
  schedule: Array<{
    time: string;
    task: string;
  }>;
  recommendations: string[];
  productivityScore: number;
};

export type AIExecutionMetrics = {
  executionTime: number;
  provider: string;
  model: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null;
  promptVersion: string;
};

export type PlanDayResult = {
  data: DailyPlan;
  metrics: AIExecutionMetrics;
};

export type Subtask = {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedMinutes?: number;
};

export type TaskBreakdown = {
  summary: string;
  estimatedMinutes: number;
  subtasks: Subtask[];
};

export type TaskBreakdownResult = {
  data: TaskBreakdown;
  metrics: AIExecutionMetrics;
};

