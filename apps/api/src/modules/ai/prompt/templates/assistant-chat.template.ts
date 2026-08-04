import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type AssistantChatPromptVariables = {
  readonly userName: string;
  readonly today: string;
  readonly weekday: string;
  readonly tasks: string;
  readonly conversationHistory: string;
  readonly userMessage: string;
};

export function assistantChatTemplate(
  variables: AssistantChatPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.assistantChat,
    },
    {
      role: "user",
      content: renderPromptText(
        `User Context:
Name: {{userName}}
Current Date: {{today}}
Day of Week: {{weekday}}

User's Workspace Tasks (JSON):
{{tasks}}

Recent Conversation History:
{{conversationHistory}}

User's Current Message:
"{{userMessage}}"

Strict Rules:
1. You are AetherMind, an intelligent productivity coach.
2. Always answer the user's request using the available workspace tasks, schedule, and context.
3. Never return an empty reply. The 'reply' field MUST contain at least one complete, meaningful sentence.
4. If information is missing or unclear, explain what is missing.
5. suggestedActions may be an array of follow-up chips or an empty array [].
6. Return ONLY valid JSON with double quotes.
7. No markdown code fences.
8. No explanations outside JSON.
9. No reasoning or comments.

IMPORTANT:
You MUST always populate "reply".
Never return:
{
  "reply": "",
  "suggestedActions": []
}

If you cannot answer, reply with:
"I'm missing enough information to answer your question. Please provide additional details."

Output JSON Schema:
{
  "reply": "<detailed answer string>",
  "suggestedActions": ["<Action 1>", "<Action 2>"]
}`,
        variables,
      ),
    },
  ];
}
