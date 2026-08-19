import type { z } from "zod";

import type {
  DailyPlannerContext,
  TaskBreakdownContext,
} from "../context/context.types.js";
import {
  dailyPlannerResponseSchema,
  productivityInsightsResponseSchema,
  smartRescheduleResponseSchema,
  taskBreakdownResponseSchema,
  taskPrioritizationResponseSchema,
  weeklyReviewResponseSchema,
  assistantChatResponseSchema,
  dailyPlannerGeminiSchema,
  taskBreakdownGeminiSchema,
  taskPrioritizationGeminiSchema,
  smartRescheduleGeminiSchema,
  weeklyReviewGeminiSchema,
  productivityInsightsGeminiSchema,
  assistantChatGeminiSchema,
  type AssistantChatResponse,
  type DailyPlannerResponse,
  type ProductivityInsightsResponse,
  type SmartRescheduleResponse,
  type TaskBreakdownResponse,
  type TaskPrioritizationResponse,
  type WeeklyReviewResponse,
} from "../parser/schemas/index.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
import { formatTaskContextForPrompt } from "../prompt/prompt-utils.js";
import type { BuiltPrompt } from "../prompt/prompt.types.js";
import type { ThinkingLevel } from "../providers/types.js";

export type PipelinePromptDefinition<TContext, TResponse> = {
  readonly buildPrompt: (
    context: TContext,
    promptBuilder: PromptBuilder,
  ) => BuiltPrompt;
  readonly schema: z.ZodType<TResponse>;
  readonly responseSchema?: unknown;
  readonly options?: {
    readonly temperature?: number;
    readonly topP?: number;
    readonly maxOutputTokens?: number;
    readonly numCtx?: number;
    readonly thinkingLevel?: ThinkingLevel;
  };
  readonly ttlMs?: number;
};

export type PipelinePromptRegistry = {
  readonly "daily-planner": PipelinePromptDefinition<
    DailyPlannerContext,
    DailyPlannerResponse
  >;
  readonly "task-breakdown": PipelinePromptDefinition<
    TaskBreakdownContext,
    TaskBreakdownResponse
  >;
  readonly "task-prioritization": PipelinePromptDefinition<
    DailyPlannerContext,
    TaskPrioritizationResponse
  >;
  readonly prioritize: PipelinePromptDefinition<
    DailyPlannerContext,
    TaskPrioritizationResponse
  >;
  readonly "smart-reschedule": PipelinePromptDefinition<
    DailyPlannerContext,
    SmartRescheduleResponse
  >;
  readonly reschedule: PipelinePromptDefinition<
    DailyPlannerContext,
    SmartRescheduleResponse
  >;
  readonly "weekly-review": PipelinePromptDefinition<
    DailyPlannerContext,
    WeeklyReviewResponse
  >;
  readonly "productivity-insights": PipelinePromptDefinition<
    DailyPlannerContext,
    ProductivityInsightsResponse
  >;
  readonly "assistant-chat": PipelinePromptDefinition<
    DailyPlannerContext,
    AssistantChatResponse
  >;
};

export const pipelinePromptRegistry: PipelinePromptRegistry = {
  "daily-planner": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildDailyPlannerPrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        today: context.time.date,
        userName: context.user.firstName + " " + context.user.lastName,
      }),
    schema: dailyPlannerResponseSchema,
    responseSchema: dailyPlannerGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "medium",
    },
    ttlMs: 120_000, // 2 minutes
  },
  "task-breakdown": {
    buildPrompt: (context: TaskBreakdownContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildTaskBreakdownPrompt({
        taskTitle: context.targetTask.title,
        taskDescription:
          context.targetTask.description ?? "No description provided.",
        priority: context.targetTask.priority,
        status: context.targetTask.status,
        dueDate: context.targetTask.dueDate
          ? context.targetTask.dueDate.toISOString().slice(0, 10)
          : "None",
        estimatedMinutes: String(context.targetTask.estimatedMinutes ?? 0),
        existingSubtasks:
          context.targetTask.existingSubtasks.length > 0
            ? context.targetTask.existingSubtasks.join(", ")
            : "None",
        userName: `${context.user.firstName} ${context.user.lastName}`,
        currentDate: context.time.date,
        weekday: context.time.dayOfWeek,
      }),
    schema: taskBreakdownResponseSchema,
    responseSchema: taskBreakdownGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "medium",
    },
    ttlMs: 600_000, // 10 minutes per task ID
  },
  "task-prioritization": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildPrioritizationPrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: taskPrioritizationResponseSchema,
    responseSchema: taskPrioritizationGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "low",
    },
    ttlMs: 120_000, // 2 minutes
  },
  prioritize: {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildPrioritizationPrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: taskPrioritizationResponseSchema,
    responseSchema: taskPrioritizationGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "low",
    },
    ttlMs: 120_000, // 2 minutes
  },
  "smart-reschedule": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildSmartReschedulePrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: smartRescheduleResponseSchema,
    responseSchema: smartRescheduleGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "medium",
    },
    ttlMs: 120_000, // 2 minutes
  },
  reschedule: {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildSmartReschedulePrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: smartRescheduleResponseSchema,
    responseSchema: smartRescheduleGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "medium",
    },
    ttlMs: 120_000, // 2 minutes
  },
  "weekly-review": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildWeeklyReviewPrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "all" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: weeklyReviewResponseSchema,
    responseSchema: weeklyReviewGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "low",
    },
    ttlMs: 300_000, // 5 minutes
  },
  "productivity-insights": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildProductivityInsightsPrompt({
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "all" }),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: productivityInsightsResponseSchema,
    responseSchema: productivityInsightsGeminiSchema,
    options: {
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "low",
    },
    ttlMs: 300_000, // 5 minutes
  },
  "assistant-chat": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildAssistantChatPrompt({
        userName: `${context.user.firstName} ${context.user.lastName}`,
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        tasks: formatTaskContextForPrompt(context.tasks, { mode: "active" }),
        conversationHistory: context.conversationHistory ?? "No prior history.",
        userMessage: context.userMessage ?? "",
      }),
    schema: assistantChatResponseSchema,
    responseSchema: assistantChatGeminiSchema,
    options: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 1024,
      numCtx: 4096,
      thinkingLevel: "low",
    },
  },
};

