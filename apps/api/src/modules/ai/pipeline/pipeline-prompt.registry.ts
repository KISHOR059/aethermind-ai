import type { z } from "zod";

import type {
  DailyPlannerContext,
  TaskBreakdownContext,
} from "../context/context.types.js";
import {
  dailyPlannerResponseSchema,
  taskBreakdownResponseSchema,
  type DailyPlannerResponse,
  type TaskBreakdownResponse,
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
};

