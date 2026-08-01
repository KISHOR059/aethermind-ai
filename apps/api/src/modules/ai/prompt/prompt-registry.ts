import type { PromptDefinition } from "./prompt.types.js";
import { dailyPlanTemplate } from "./templates/daily-plan.template.js";
import type { DailyPlanPromptVariables } from "./templates/daily-plan.template.js";
import { prioritizeTemplate } from "./templates/prioritize.template.js";
import type { PrioritizationPromptVariables } from "./templates/prioritize.template.js";
import { summarizeTemplate } from "./templates/summarize.template.js";
import type { SummaryPromptVariables } from "./templates/summarize.template.js";

export type PromptRegistry = {
  readonly "daily-plan": PromptDefinition<DailyPlanPromptVariables>;
  readonly prioritize: PromptDefinition<PrioritizationPromptVariables>;
  readonly summarize: PromptDefinition<SummaryPromptVariables>;
};

export const promptRegistry = {
  "daily-plan": {
    id: "daily-plan",
    version: "1.0.0",
    name: "Daily Planner",
    description: "Builds a prompt fragment set for daily task planning.",
    template: dailyPlanTemplate,
  },
  prioritize: {
    id: "prioritize",
    version: "1.0.0",
    name: "Task Prioritizer",
    description: "Builds a prompt fragment set for task prioritization.",
    template: prioritizeTemplate,
  },
  summarize: {
    id: "summarize",
    version: "1.0.0",
    name: "Task Summarizer",
    description: "Builds a prompt fragment set for task summarization.",
    template: summarizeTemplate,
  },
} satisfies PromptRegistry;
