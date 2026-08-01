import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type DailyPlanPromptVariables = {
  readonly tasks: string;
  readonly today: string;
  readonly userName: string;
};

export function dailyPlanTemplate(
  variables: DailyPlanPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.planner,
    },
    {
      role: "user",
      content: renderPromptText(
        "Create a daily plan for {{userName}} for {{today}} using these tasks:\n{{tasks}}",
        variables,
      ),
    },
  ];
}
