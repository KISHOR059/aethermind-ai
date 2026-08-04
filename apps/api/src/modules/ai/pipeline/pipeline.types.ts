import type { UsageMetadata } from "../providers/types.js";
import type {
  DailyPlannerResponse,
  TaskBreakdownResponse,
} from "../parser/schemas/index.js";

export type PipelinePromptId = "daily-planner" | "task-breakdown";

export type PipelineResultMap = {
  readonly "daily-planner": DailyPlannerResponse;
  readonly "task-breakdown": TaskBreakdownResponse;
};

export type AIExecutionRequest<TPrompt extends PipelinePromptId = PipelinePromptId> = {
  readonly prompt: TPrompt;
  readonly userId: string;
  readonly taskId?: string;
};

export type AIExecutionMetrics = {
  readonly executionTime: number;
  readonly provider: string;
  readonly model: string;
  readonly tokenUsage: UsageMetadata | null;
  readonly promptVersion: string;
};

export type AIExecutionResult<T> = {
  readonly data: T;
  readonly metrics: AIExecutionMetrics;
};
