import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type SmartReschedulePromptVariables = {
  readonly tasks: string;
  readonly userName: string;
  readonly today: string;
  readonly weekday: string;
};

const SMART_RESCHEDULE_PROMPT_TEMPLATE = `Analyze all tasks below for {{userName}} on {{today}} ({{weekday}}).
Intelligently reschedule unfinished and overdue tasks into a realistic revised work schedule.

Rules:
1. Move overdue work first.
2. Respect due dates.
3. Group similar work together to minimize context switching.
4. Recommend breaks where appropriate.
5. Avoid unrealistic, overcrowded daily schedules.
6. Provide a realistic productivity score (0-100).
7. If no tasks are present in context, return empty schedule and movedTasks arrays.

Return ONLY valid JSON matching this schema:
{
  "summary": "Clear high-level overview of the revised schedule strategy",
  "schedule": [
    {
      "taskId": "task-uuid-1",
      "title": "Task Title",
      "time": "09:00",
      "estimatedMinutes": 60,
      "reason": "Highest priority and overdue task scheduled first."
    }
  ],
  "movedTasks": [
    {
      "taskId": "task-uuid-2",
      "oldDate": "2026-08-03",
      "newDate": "2026-08-04",
      "reason": "Rescheduled due to workload balancing."
    }
  ],
  "recommendations": [
    "Actionable tip 1",
    "Actionable tip 2"
  ],
  "productivityScore": 92
}

<task_context>
{{tasks}}
</task_context>`;

export function smartRescheduleTemplate(
  variables: SmartReschedulePromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.smartReschedule,
    },
    {
      role: "user",
      content: renderPromptText(SMART_RESCHEDULE_PROMPT_TEMPLATE, variables),
    },
  ];
}
