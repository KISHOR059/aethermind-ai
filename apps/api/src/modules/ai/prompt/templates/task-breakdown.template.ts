import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type TaskBreakdownPromptVariables = {
  readonly taskTitle: string;
  readonly taskDescription: string;
  readonly priority: string;
  readonly status: string;
  readonly dueDate: string;
  readonly estimatedMinutes: string;
  readonly existingSubtasks: string;
  readonly userName: string;
  readonly currentDate: string;
  readonly weekday: string;
};

export function taskBreakdownTemplate(
  variables: TaskBreakdownPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.taskBreakdown,
    },
    {
      role: "user",
      content: renderPromptText(
        `Act as a senior project planner. Break down the following task into logical, actionable subtasks for {{userName}}.

<task_details>
- Title: {{taskTitle}}
- Description: {{taskDescription}}
- Priority: {{priority}}
- Status: {{status}}
- Due Date: {{dueDate}}
- Estimated Duration: {{estimatedMinutes}} minutes
- Existing Subtasks: {{existingSubtasks}}
- Current Date: {{currentDate}} ({{weekday}})
</task_details>

Requirements:
1. Generate between 5 and 15 subtasks.
2. Each subtask must be atomic, actionable, realistically completable, and avoid duplicates.
3. Subtasks must respect natural dependency order.
4. Return ONLY valid JSON.
5. No markdown, no explanations, no code fences, no reasoning, no comments, no trailing commas.
6. Use double quotes only.

Follow this JSON schema exactly:
{
  "summary": "High-level summary of the breakdown plan",
  "estimatedMinutes": 180,
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Detailed description of what to do",
      "priority": "HIGH",
      "estimatedMinutes": 30
    }
  ]
}

Allowed priority values: "LOW", "MEDIUM", "HIGH", "URGENT".`,
        variables,
      ),
    },
  ];
}
