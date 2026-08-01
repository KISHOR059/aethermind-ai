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
        "Plan {{userName}}'s day for {{today}} using the task context below. Prioritize overdue and high-priority work, schedule difficult tasks first, avoid context switching, estimate a realistic workload, and suggest breaks. Return structured JSON only with exactly these fields: summary (string), priorities (string[]), schedule ({ time: string, task: string }[]), recommendations (string[]), productivityScore (number from 0 to 100).\n\nTask context:\n{{tasks}}",
        variables,
      ),
    },
  ];
}
