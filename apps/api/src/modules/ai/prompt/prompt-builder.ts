import { promptRegistry } from "./prompt-registry.js";
import type {
  BuiltPrompt,
  PromptDefinition,
} from "./prompt.types.js";
import type { PromptRegistry } from "./prompt-registry.js";
import type { DailyPlanPromptVariables } from "./templates/daily-plan.template.js";
import type { PrioritizationPromptVariables } from "./templates/prioritize.template.js";
import type { SummaryPromptVariables } from "./templates/summarize.template.js";

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
    variables: PrioritizationPromptVariables,
  ): BuiltPrompt {
    return this.build(this.registry.prioritize, variables);
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
  variables: PrioritizationPromptVariables,
): BuiltPrompt => defaultPromptBuilder.buildPrioritizationPrompt(variables);
