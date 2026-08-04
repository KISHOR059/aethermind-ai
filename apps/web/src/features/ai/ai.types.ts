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

export type PrioritizedTask = {
  taskId: string;
  title: string;
  recommendedPriority: number;
  reason: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedFocusMinutes: number;
};

export type TaskPrioritization = {
  summary: string;
  prioritizedTasks: PrioritizedTask[];
  recommendations: string[];
};

export type TaskPrioritizationResult = {
  data: TaskPrioritization;
  metrics: AIExecutionMetrics;
};

export type RescheduledItem = {
  taskId: string;
  title: string;
  time: string;
  estimatedMinutes: number;
  reason: string;
};

export type MovedTask = {
  taskId: string;
  oldDate: string;
  newDate: string;
  reason: string;
};

export type SmartReschedule = {
  summary: string;
  schedule: RescheduledItem[];
  movedTasks: MovedTask[];
  recommendations: string[];
  productivityScore: number;
};

export type SmartRescheduleResult = {
  data: SmartReschedule;
  metrics: AIExecutionMetrics;
};



