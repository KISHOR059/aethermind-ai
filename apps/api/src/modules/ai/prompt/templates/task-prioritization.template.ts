import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type TaskPrioritizationPromptVariables = {
  readonly tasks: string;
  readonly userName: string;
  readonly today: string;
  readonly weekday: string;
};

const TASK_PRIORITIZATION_PROMPT_TEMPLATE = `Analyze every task in the task context below for {{userName}} on {{today}} ({{weekday}}).
Return an ordered list of all tasks ranked by priority (recommendedPriority 1 = highest priority).

For each task, provide:
- taskId (must match input taskId exactly)
- title (must match input task title)
- recommendedPriority (integer starting from 1 for top priority)
- reason (clear explanation why this task received this ranking based on urgency, dependencies, effort, context switching, etc.)
- urgency ("LOW", "MEDIUM", "HIGH", "URGENT")
- estimatedFocusMinutes (integer estimated minutes for a deep work session)

Also provide an overall summary and 2-4 actionable recommendations. If no tasks are present in context, return an empty prioritizedTasks list [].

Return ONLY valid JSON matching this schema:
{
  "summary": "Overall prioritization strategy and focus advice",
  "prioritizedTasks": [
    {
      "taskId": "task-id-1",
      "title": "Task Title",
      "recommendedPriority": 1,
      "reason": "Why this task is ranked #1",
      "urgency": "HIGH",
      "estimatedFocusMinutes": 45
    }
  ],
  "recommendations": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}

<task_context>
{{tasks}}
</task_context>`;

export function taskPrioritizationTemplate(
  variables: TaskPrioritizationPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.taskPrioritizer,
    },
    {
      role: "user",
      content: renderPromptText(TASK_PRIORITIZATION_PROMPT_TEMPLATE, variables),
    },
  ];
}
