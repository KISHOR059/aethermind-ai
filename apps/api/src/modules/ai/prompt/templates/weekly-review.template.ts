import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type WeeklyReviewPromptVariables = {
  readonly tasks: string;
  readonly userName: string;
  readonly today: string;
  readonly weekday: string;
};

const WEEKLY_REVIEW_PROMPT_TEMPLATE = `Analyze the past seven days of work history and task activity for {{userName}} as of {{today}} ({{weekday}}).
Generate a comprehensive, encouraging, and constructive weekly productivity review.

Tasks activity history for the past 7 days:
{{tasks}}

Rules:
1. Highlight top achievements completed over the week.
2. Identify productivity patterns and insights (e.g. most productive days, bottlenecks, postponed large tasks).
3. Provide realistic, actionable recommendations for the upcoming week.
4. Calculate weekly statistics based on task counts and estimated minutes.
5. Provide a realistic overall productivity score (0-100).

Return ONLY valid JSON matching this schema:
{
  "summary": "Clear, high-level summary of weekly progress and performance",
  "achievements": [
    "Completed core feature tasks ahead of deadline",
    "Reduced overdue work item backlog"
  ],
  "insights": [
    "Tuesday was your most productive day.",
    "Large tasks were frequently postponed during afternoon hours."
  ],
  "recommendations": [
    "Schedule deep work in the morning when focus is highest.",
    "Break large tasks down into smaller subtasks before starting."
  ],
  "statistics": {
    "completedTasks": 24,
    "pendingTasks": 6,
    "overdueTasks": 2,
    "completionRate": 80,
    "estimatedMinutesWorked": 960
  },
  "productivityScore": 91
}`;

export function weeklyReviewTemplate(
  variables: WeeklyReviewPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.weeklyReview,
    },
    {
      role: "user",
      content: renderPromptText(WEEKLY_REVIEW_PROMPT_TEMPLATE, variables),
    },
  ];
}
