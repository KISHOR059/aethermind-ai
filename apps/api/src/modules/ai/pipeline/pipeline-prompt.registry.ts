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
  type AssistantChatResponse,
  type DailyPlannerResponse,
  type ProductivityInsightsResponse,
  type SmartRescheduleResponse,
  type TaskBreakdownResponse,
  type TaskPrioritizationResponse,
  type WeeklyReviewResponse,
} from "../parser/schemas/index.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
import type { BuiltPrompt } from "../prompt/prompt.types.js";

export type PipelinePromptDefinition<TContext, TResponse> = {
  readonly buildPrompt: (
    context: TContext,
    promptBuilder: PromptBuilder,
  ) => BuiltPrompt;
  readonly schema: z.ZodType<TResponse>;
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
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        userName: context.user.firstName + " " + context.user.lastName,
      }),
    schema: dailyPlannerResponseSchema,
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
  },
  "task-prioritization": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildPrioritizationPrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: taskPrioritizationResponseSchema,
  },
  prioritize: {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildPrioritizationPrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: taskPrioritizationResponseSchema,
  },
  "smart-reschedule": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildSmartReschedulePrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: smartRescheduleResponseSchema,
  },
  reschedule: {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildSmartReschedulePrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: smartRescheduleResponseSchema,
  },
  "weekly-review": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildWeeklyReviewPrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: weeklyReviewResponseSchema,
  },
  "productivity-insights": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildProductivityInsightsPrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        userName: `${context.user.firstName} ${context.user.lastName}`,
      }),
    schema: productivityInsightsResponseSchema,
  },
  "assistant-chat": {
    buildPrompt: (context: DailyPlannerContext, promptBuilder: PromptBuilder) =>
      promptBuilder.buildAssistantChatPrompt({
        userName: `${context.user.firstName} ${context.user.lastName}`,
        today: context.time.date,
        weekday: context.time.dayOfWeek,
        tasks: JSON.stringify(context.tasks),
        conversationHistory: context.conversationHistory ?? "No prior history.",
        userMessage: context.userMessage ?? "",
      }),
    schema: assistantChatResponseSchema,
  },
};


