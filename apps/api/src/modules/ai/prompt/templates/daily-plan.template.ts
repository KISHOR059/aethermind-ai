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
        `Plan {{userName}}'s day for {{today}} using the task context below. Prioritize overdue and high-priority work, schedule difficult tasks first, avoid context switching, estimate a realistic workload, and suggest breaks.

Return ONLY valid JSON.
No markdown.
No code fences.
No explanations.
No reasoning.
No comments.
No trailing commas.
Double quotes only.
Follow the provided schema exactly:
{
  "summary": "short summary",
  "priorities": ["task title"],
  "schedule": [{ "time": "09:00-10:00", "task": "task title" }],
  "recommendations": ["recommendation"],
  "productivityScore": 75
}

Rules: summary must be a string; priorities and recommendations must be arrays of strings; schedule must be an array, and every schedule item must contain exactly time and task strings; productivityScore must be a number from 0 to 100.

Task context:
{{tasks}}`,
        variables,
      ),
    },
  ];
}
