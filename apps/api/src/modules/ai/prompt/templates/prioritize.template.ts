import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type PrioritizationPromptVariables = {
  readonly tasks: string;
  readonly today: string;
  readonly userName: string;
};

export function prioritizeTemplate(
  variables: PrioritizationPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.taskPrioritizer,
    },
    {
      role: "user",
      content: renderPromptText(
        "Prioritize these tasks for {{userName}} on {{today}}:\n{{tasks}}",
        variables,
      ),
    },
  ];
}
