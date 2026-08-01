import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type SummaryPromptVariables = {
  readonly tasks: string;
  readonly userName: string;
};

export function summarizeTemplate(
  variables: SummaryPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.summarizer,
    },
    {
      role: "user",
      content: renderPromptText(
        "Summarize the following work for {{userName}}:\n{{tasks}}",
        variables,
      ),
    },
  ];
}
