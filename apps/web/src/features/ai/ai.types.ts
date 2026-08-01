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
