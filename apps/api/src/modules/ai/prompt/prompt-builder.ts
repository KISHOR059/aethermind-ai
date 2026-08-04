import { promptRegistry } from "./prompt-registry.js";
import type {
  BuiltPrompt,
  PromptDefinition,
} from "./prompt.types.js";
import type { PromptRegistry } from "./prompt-registry.js";
import type { DailyPlanPromptVariables } from "./templates/daily-plan.template.js";
import type { TaskPrioritizationPromptVariables } from "./templates/task-prioritization.template.js";
import type { SummaryPromptVariables } from "./templates/summarize.template.js";
import type { TaskBreakdownPromptVariables } from "./templates/task-breakdown.template.js";
import type { SmartReschedulePromptVariables } from "./templates/smart-reschedule.template.js";
import type { WeeklyReviewPromptVariables } from "./templates/weekly-review.template.js";
import type { ProductivityInsightsPromptVariables } from "./templates/productivity-insights.template.js";
import type { AssistantChatPromptVariables } from "./templates/assistant-chat.template.js";

export class PromptBuilder {
  public constructor(
    private readonly registry: PromptRegistry = promptRegistry,
  ) {}

  public buildDailyPlannerPrompt(
    variables: DailyPlanPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["daily-plan"], variables);
  }

  public buildSummaryPrompt(variables: SummaryPromptVariables): BuiltPrompt {
    return this.build(this.registry.summarize, variables);
  }

  public buildPrioritizationPrompt(
    variables: TaskPrioritizationPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["task-prioritization"], variables);
  }

  public buildTaskBreakdownPrompt(
    variables: TaskBreakdownPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["task-breakdown"], variables);
  }

  public buildSmartReschedulePrompt(
    variables: SmartReschedulePromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["smart-reschedule"], variables);
  }

  public buildWeeklyReviewPrompt(
    variables: WeeklyReviewPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["weekly-review"], variables);
  }

  public buildProductivityInsightsPrompt(
    variables: ProductivityInsightsPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["productivity-insights"], variables);
  }

  public buildAssistantChatPrompt(
    variables: AssistantChatPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry["assistant-chat"], variables);
  }

  private build<TVariables extends object>(
    definition: PromptDefinition<TVariables>,
    variables: TVariables,
  ): BuiltPrompt {
    return {
      id: definition.id,
      version: definition.version,
      name: definition.name,
      description: definition.description,
      fragments: definition.template(variables),
    };
  }
}

const defaultPromptBuilder = new PromptBuilder();

export const buildDailyPlannerPrompt = (
  variables: DailyPlanPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildDailyPlannerPrompt(variables);

export const buildSummaryPrompt = (
  variables: SummaryPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildSummaryPrompt(variables);

export const buildPrioritizationPrompt = (
  variables: TaskPrioritizationPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildPrioritizationPrompt(variables);

export const buildTaskBreakdownPrompt = (
  variables: TaskBreakdownPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildTaskBreakdownPrompt(variables);

export const buildSmartReschedulePrompt = (
  variables: SmartReschedulePromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildSmartReschedulePrompt(variables);

export const buildWeeklyReviewPrompt = (
  variables: WeeklyReviewPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildWeeklyReviewPrompt(variables);

export const buildProductivityInsightsPrompt = (
  variables: ProductivityInsightsPromptVariables,
): BuiltPrompt =>
  defaultPromptBuilder.buildProductivityInsightsPrompt(variables);

export const buildAssistantChatPrompt = (
  variables: AssistantChatPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildAssistantChatPrompt(variables);



