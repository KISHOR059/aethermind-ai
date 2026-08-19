import { Type, type Schema } from "@google/genai";

export const dailyPlannerGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Brief executive summary of today's plan and focus strategy.",
    },
    priorities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Top priority task titles or focal points for today.",
    },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: {
            type: Type.STRING,
            description: "Time block e.g. 09:00-10:00 or 09:00",
          },
          task: {
            type: Type.STRING,
            description: "Task name or focus activity planned for this block",
          },
        },
        required: ["time", "task"],
      },
      description: "Chronological schedule blocks for today.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Actionable productivity or pacing advice.",
    },
    productivityScore: {
      type: Type.INTEGER,
      description: "Predicted productivity score between 0 and 100.",
    },
  },
  required: [
    "summary",
    "priorities",
    "schedule",
    "recommendations",
    "productivityScore",
  ],
};

export const taskBreakdownGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Executive summary of the subtask breakdown approach.",
    },
    estimatedMinutes: {
      type: Type.NUMBER,
      description: "Total estimated time in minutes for the overall task.",
    },
    subtasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Clear, action-oriented subtask title.",
          },
          description: {
            type: Type.STRING,
            description: "Detailed description of steps required.",
          },
          priority: {
            type: Type.STRING,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Priority level of the subtask.",
          },
          estimatedMinutes: {
            type: Type.NUMBER,
            description: "Estimated focus time in minutes.",
          },
        },
        required: ["title", "priority", "estimatedMinutes"],
      },
      description: "List of discrete, actionable subtasks.",
    },
  },
  required: ["summary", "estimatedMinutes", "subtasks"],
};

export const taskPrioritizationGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "High-level summary of prioritization logic and workload analysis.",
    },
    prioritizedTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: {
            type: Type.STRING,
            description: "Unique identifier of the task.",
          },
          title: {
            type: Type.STRING,
            description: "Title of the task.",
          },
          recommendedPriority: {
            type: Type.INTEGER,
            description: "Numerical priority rank starting from 1 (highest priority).",
          },
          reason: {
            type: Type.STRING,
            description: "Justification for the priority placement based on urgency and impact.",
          },
          urgency: {
            type: Type.STRING,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Calculated urgency level.",
          },
          estimatedFocusMinutes: {
            type: Type.INTEGER,
            description: "Estimated time to allocate in minutes.",
          },
        },
        required: [
          "taskId",
          "title",
          "recommendedPriority",
          "reason",
          "urgency",
          "estimatedFocusMinutes",
        ],
      },
      description: "Ranked list of tasks ordered by priority.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Strategic advice on execution order and focus management.",
    },
  },
  required: ["summary", "prioritizedTasks", "recommendations"],
};

export const smartRescheduleGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Summary of schedule adjustments made to optimize focus.",
    },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: {
            type: Type.STRING,
            description: "Task identifier.",
          },
          title: {
            type: Type.STRING,
            description: "Task title.",
          },
          time: {
            type: Type.STRING,
            description: "Scheduled time slot e.g. 10:00-11:00.",
          },
          estimatedMinutes: {
            type: Type.INTEGER,
            description: "Estimated duration in minutes.",
          },
          reason: {
            type: Type.STRING,
            description: "Reasoning for slotting this task into this time window.",
          },
        },
        required: ["taskId", "title", "time", "estimatedMinutes", "reason"],
      },
      description: "Updated daily schedule with optimized time slots.",
    },
    movedTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: {
            type: Type.STRING,
            description: "Identifier of the deferred task.",
          },
          oldDate: {
            type: Type.STRING,
            description: "Original due/scheduled date.",
          },
          newDate: {
            type: Type.STRING,
            description: "Newly recommended date.",
          },
          reason: {
            type: Type.STRING,
            description: "Explanation for deferring or rescheduling.",
          },
        },
        required: ["taskId", "oldDate", "newDate", "reason"],
      },
      description: "Tasks moved to future dates to avoid overload.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Tips for adhering to the revised timeline.",
    },
    productivityScore: {
      type: Type.INTEGER,
      description: "Predicted productivity score between 0 and 100.",
    },
  },
  required: [
    "summary",
    "schedule",
    "movedTasks",
    "recommendations",
    "productivityScore",
  ],
};

export const weeklyReviewGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Executive retrospective summary of weekly performance.",
    },
    achievements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key milestones, deliverables, and goals achieved.",
    },
    insights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Data-driven observations about productivity trends.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Action items to improve throughput in the coming week.",
    },
    statistics: {
      type: Type.OBJECT,
      properties: {
        completedTasks: {
          type: Type.INTEGER,
          description: "Count of tasks completed this week.",
        },
        pendingTasks: {
          type: Type.INTEGER,
          description: "Count of tasks remaining in progress or todo.",
        },
        overdueTasks: {
          type: Type.INTEGER,
          description: "Count of overdue tasks.",
        },
        completionRate: {
          type: Type.INTEGER,
          description: "Task completion percentage (0-100).",
        },
        estimatedMinutesWorked: {
          type: Type.INTEGER,
          description: "Total focus time logged/estimated in minutes.",
        },
      },
      required: [
        "completedTasks",
        "pendingTasks",
        "overdueTasks",
        "completionRate",
        "estimatedMinutesWorked",
      ],
    },
    productivityScore: {
      type: Type.INTEGER,
      description: "Overall weekly productivity score between 0 and 100.",
    },
  },
  required: [
    "summary",
    "achievements",
    "insights",
    "recommendations",
    "statistics",
    "productivityScore",
  ],
};

export const productivityInsightsGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Comprehensive analytical summary of productivity habits.",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Identified productivity strengths and positive patterns.",
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Bottlenecks, context switching, or areas for improvement.",
    },
    patterns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Time and workflow patterns detected in task completion.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Targeted coaching tips to boost daily efficiency.",
    },
    statistics: {
      type: Type.OBJECT,
      properties: {
        completionRate: {
          type: Type.INTEGER,
          description: "Overall completion rate percentage (0-100).",
        },
        currentStreak: {
          type: Type.INTEGER,
          description: "Current consecutive productive days streak.",
        },
        longestStreak: {
          type: Type.INTEGER,
          description: "All-time longest productive streak in days.",
        },
        mostProductiveDay: {
          type: Type.STRING,
          description: "Day of the week with highest task completion rate.",
        },
        estimatedHoursWorked: {
          type: Type.NUMBER,
          description: "Total focus hours worked.",
        },
      },
      required: [
        "completionRate",
        "currentStreak",
        "longestStreak",
        "mostProductiveDay",
        "estimatedHoursWorked",
      ],
    },
    productivityScore: {
      type: Type.INTEGER,
      description: "Productivity health score between 0 and 100.",
    },
  },
  required: [
    "summary",
    "strengths",
    "weaknesses",
    "patterns",
    "recommendations",
    "statistics",
    "productivityScore",
  ],
};

export const assistantChatGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description: "Direct, helpful, and meaningful response to the user's inquiry.",
    },
    suggestedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of relevant follow-up action chips or quick prompts.",
    },
  },
  required: ["reply", "suggestedActions"],
};
