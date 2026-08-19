import type { UsageMetadata } from "../providers/types.js";
import type {
  AssistantChatResponse,
  DailyPlannerResponse,
  ProductivityInsightsResponse,
  SmartRescheduleResponse,
  TaskBreakdownResponse,
  TaskPrioritizationResponse,
  WeeklyReviewResponse,
} from "../parser/schemas/index.js";

export type PipelinePromptId =
  | "daily-planner"
  | "task-breakdown"
  | "task-prioritization"
  | "prioritize"
  | "smart-reschedule"
  | "reschedule"
  | "weekly-review"
  | "productivity-insights"
  | "assistant-chat";

export type PipelineResultMap = {
  readonly "daily-planner": DailyPlannerResponse;
  readonly "task-breakdown": TaskBreakdownResponse;
  readonly "task-prioritization": TaskPrioritizationResponse;
  readonly prioritize: TaskPrioritizationResponse;
  readonly "smart-reschedule": SmartRescheduleResponse;
  readonly reschedule: SmartRescheduleResponse;
  readonly "weekly-review": WeeklyReviewResponse;
  readonly "productivity-insights": ProductivityInsightsResponse;
  readonly "assistant-chat": AssistantChatResponse;
};

export type AIExecutionRequest<TPrompt extends PipelinePromptId = PipelinePromptId> = {
  readonly prompt: TPrompt;
  readonly userId: string;
  readonly taskId?: string;
  readonly userMessage?: string;
  readonly conversationHistory?: string;
};

export type AIExecutionMetrics = {
  readonly executionTime: number;
  readonly provider: string;
  readonly model: string;
  readonly tokenUsage: UsageMetadata | null;
  readonly promptVersion: string;
  readonly fallbackUsed?: boolean;
  readonly primaryProvider?: string;
  readonly fallbackReason?: string;
  readonly retryCount?: number;
  readonly stageTimings?: {
    readonly contextTimeMs: number;
    readonly promptTimeMs: number;
    readonly llmTimeMs: number;
    readonly parseTimeMs: number;
    readonly totalTimeMs: number;
    readonly cached?: boolean;
  };
};

export type AIExecutionResult<T> = {
  readonly data: T;
  readonly metrics: AIExecutionMetrics;
};
