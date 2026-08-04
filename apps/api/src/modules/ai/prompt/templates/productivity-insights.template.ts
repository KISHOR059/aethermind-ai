import { SYSTEM_PROMPTS } from "../system-prompts.js";
import { renderPromptText } from "../prompt-renderer.js";
import type { PromptFragment } from "../prompt.types.js";

export type ProductivityInsightsPromptVariables = {
  readonly tasks: string;
  readonly userName: string;
  readonly today: string;
  readonly weekday: string;
};

const PRODUCTIVITY_INSIGHTS_PROMPT_TEMPLATE = `Analyze the comprehensive 30-day task completion history, workload distribution, and work habits for {{userName}} as of {{today}} ({{weekday}}).

Task and workload context:
{{tasks}}

Instructions:
1. Analyze overall productivity, completion rates, streaks, and focus duration.
2. Identify 2-4 key user strengths (e.g., high focus on urgent tasks, consistent morning streak).
3. Identify 2-4 key weaknesses or bottlenecks (e.g., postponing low priority tasks, high overdue rate).
4. Identify 2-4 key work patterns/habits (e.g., most productive on Tuesdays, context switching during peak hours).
5. Formulate 2-4 clear, actionable recommendations for long-term habits and efficiency.
6. Calculate statistics and assign a realistic productivity score (0-100).

Return ONLY valid JSON matching this schema:
{
  "summary": "Comprehensive 2-3 sentence overview of user productivity patterns and work style.",
  "strengths": [
    "Consistently completes high-priority technical tasks.",
    "Maintains an active 12-day task completion streak."
  ],
  "weaknesses": [
    "Tendency to defer administrative tasks past due dates.",
    "Higher rate of task rescheduling on Fridays."
  ],
  "patterns": [
    "Tuesday is your most productive day with peak completion.",
    "Average estimated focus time is 4.5 hours per working day."
  ],
  "recommendations": [
    "Batch administrative tasks into single 30-minute afternoon blocks.",
    "Use task breakdown for complex work items to maintain momentum."
  ],
  "statistics": {
    "completionRate": 87,
    "currentStreak": 12,
    "longestStreak": 18,
    "mostProductiveDay": "Tuesday",
    "estimatedHoursWorked": 42
  },
  "productivityScore": 91
}`;

export function productivityInsightsTemplate(
  variables: ProductivityInsightsPromptVariables,
): readonly PromptFragment[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPTS.productivityInsights,
    },
    {
      role: "user",
      content: renderPromptText(PRODUCTIVITY_INSIGHTS_PROMPT_TEMPLATE, variables),
    },
  ];
}
