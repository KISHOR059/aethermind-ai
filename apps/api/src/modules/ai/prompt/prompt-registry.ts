import type { PromptDefinition } from "./prompt.types.js";
import { dailyPlanTemplate } from "./templates/daily-plan.template.js";
import type { DailyPlanPromptVariables } from "./templates/daily-plan.template.js";
import { taskPrioritizationTemplate } from "./templates/task-prioritization.template.js";
import type { TaskPrioritizationPromptVariables } from "./templates/task-prioritization.template.js";
import { summarizeTemplate } from "./templates/summarize.template.js";
import type { SummaryPromptVariables } from "./templates/summarize.template.js";
import { taskBreakdownTemplate } from "./templates/task-breakdown.template.js";
import type { TaskBreakdownPromptVariables } from "./templates/task-breakdown.template.js";
import { smartRescheduleTemplate } from "./templates/smart-reschedule.template.js";
import type { SmartReschedulePromptVariables } from "./templates/smart-reschedule.template.js";
import { weeklyReviewTemplate } from "./templates/weekly-review.template.js";
import type { WeeklyReviewPromptVariables } from "./templates/weekly-review.template.js";
import { productivityInsightsTemplate } from "./templates/productivity-insights.template.js";
import type { ProductivityInsightsPromptVariables } from "./templates/productivity-insights.template.js";

export type PromptRegistry = {
  readonly "daily-plan": PromptDefinition<DailyPlanPromptVariables>;
  readonly prioritize: PromptDefinition<TaskPrioritizationPromptVariables>;
  readonly "task-prioritization": PromptDefinition<TaskPrioritizationPromptVariables>;
  readonly summarize: PromptDefinition<SummaryPromptVariables>;
  readonly "task-breakdown": PromptDefinition<TaskBreakdownPromptVariables>;
  readonly "smart-reschedule": PromptDefinition<SmartReschedulePromptVariables>;
  readonly reschedule: PromptDefinition<SmartReschedulePromptVariables>;
  readonly "weekly-review": PromptDefinition<WeeklyReviewPromptVariables>;
  readonly "productivity-insights": PromptDefinition<ProductivityInsightsPromptVariables>;
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
    template: taskPrioritizationTemplate,
  },
  "task-prioritization": {
    id: "task-prioritization",
    version: "1.0.0",
    name: "Task Prioritizer",
    description: "Builds a prompt fragment set for task prioritization.",
    template: taskPrioritizationTemplate,
  },
  summarize: {
    id: "summarize",
    version: "1.0.0",
    name: "Task Summarizer",
    description: "Builds a prompt fragment set for task summarization.",
    template: summarizeTemplate,
  },
  "task-breakdown": {
    id: "task-breakdown",
    version: "1.0.0",
    name: "Task Breakdown Planner",
    description: "Builds a prompt fragment set for AI task breakdown into subtasks.",
    template: taskBreakdownTemplate,
  },
  "smart-reschedule": {
    id: "smart-reschedule",
    version: "1.0.0",
    name: "Smart Rescheduler",
    description: "Builds a prompt fragment set for smart task rescheduling.",
    template: smartRescheduleTemplate,
  },
  reschedule: {
    id: "reschedule",
    version: "1.0.0",
    name: "Smart Rescheduler",
    description: "Builds a prompt fragment set for smart task rescheduling.",
    template: smartRescheduleTemplate,
  },
  "weekly-review": {
    id: "weekly-review",
    version: "1.0.0",
    name: "Weekly Reviewer",
    description: "Builds a prompt fragment set for AI-powered weekly review.",
    template: weeklyReviewTemplate,
  },
  "productivity-insights": {
    id: "productivity-insights",
    version: "1.0.0",
    name: "Productivity Insights Analyst",
    description: "Builds a prompt fragment set for AI productivity insights.",
    template: productivityInsightsTemplate,
  },
} satisfies PromptRegistry;

