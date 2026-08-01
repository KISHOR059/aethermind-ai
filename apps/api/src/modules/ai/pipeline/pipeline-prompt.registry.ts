import type { z } from "zod";

import type { DailyPlannerContext } from "../context/context.types.js";
import {
  dailyPlannerResponseSchema,
  type DailyPlannerResponse,
} from "../parser/schemas/index.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
import type { BuiltPrompt } from "../prompt/prompt.types.js";

export type PipelinePromptDefinition<TResponse> = {
  readonly buildPrompt: (
    context: DailyPlannerContext,
    promptBuilder: PromptBuilder,
  ) => BuiltPrompt;
  readonly schema: z.ZodType<TResponse>;
};

export type PipelinePromptRegistry = {
  readonly "daily-planner": PipelinePromptDefinition<DailyPlannerResponse>;
};

export const pipelinePromptRegistry = {
  "daily-planner": {
    buildPrompt: (context, promptBuilder) =>
      promptBuilder.buildDailyPlannerPrompt({
        tasks: JSON.stringify(context.tasks),
        today: context.time.date,
        userName:
          context.user.firstName + " " + context.user.lastName,
      }),
    schema: dailyPlannerResponseSchema,
  },
} satisfies PipelinePromptRegistry;
