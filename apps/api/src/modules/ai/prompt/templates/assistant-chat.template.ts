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
        `<user_profile>
Name: {{userName}}
Current Date: {{today}}
Day of Week: {{weekday}}
</user_profile>

<task_context>
{{tasks}}
</task_context>

<conversation_history>
{{conversationHistory}}
</conversation_history>

<user_message>
{{userMessage}}
</user_message>

Strict Rules:
1. You are AetherMind, an intelligent productivity coach.
2. Always answer the user's request factually using ONLY the authenticated user profile, workspace tasks, schedule, and conversation context provided above.
3. If the user asks "What is my name?", reply with the Name provided in <user_profile> ({{userName}}). Never guess or invent a different name.
4. If the user asks about overdue, upcoming, or completed tasks, use ONLY the tasks present in <task_context>.
5. Never return an empty reply. The 'reply' field MUST contain at least one complete, meaningful sentence.
6. If information is missing or not in context, state clearly what is missing.
7. suggestedActions may be an array of follow-up chips or an empty array [].
8. Return ONLY valid JSON with double quotes.
9. No markdown code fences, explanations outside JSON, reasoning, or comments.

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
