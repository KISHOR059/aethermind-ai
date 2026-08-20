import { describe, expect, it, vi, beforeEach } from "vitest";
import { AiService } from "./ai.service.js";
import { AIPipeline } from "./pipeline/ai-pipeline.js";
import { ResponseParser } from "./parser/response-parser.js";
import { PromptBuilder } from "./prompt/prompt-builder.js";
import type { ContextBuilder } from "./context/context-builder.js";
import type { AIProvider } from "./providers/ai-provider.interface.js";
import type { ITaskRepository } from "../tasks/task.repository.interface.js";
import { notificationService } from "../notifications/index.js";

vi.mock("../notifications/index.js", () => ({
  notificationService: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

describe("AiService & AIPipeline with Providers", () => {
  const userId = "507f1f77bcf86cd799439011";
  const taskId = "507f1f77bcf86cd799439012";

  const mockContextBuilder: Partial<ContextBuilder> = {
    buildDailyPlannerContext: vi.fn().mockResolvedValue({
      user: {
        id: userId,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        role: "user",
        isEmailVerified: true,
        isActive: true,
      },
      tasks: {
        tasks: [
          {
            id: taskId,
            title: "Build Feature",
            priority: "HIGH",
            status: "TODO",
            dueDate: new Date("2026-08-20T10:00:00Z"),
            estimatedMinutes: 60,
          },
        ],
      },
      settings: { timezone: "UTC", workingHours: { start: "09:00", end: "17:00" } },
      time: { date: "2026-08-19", dayOfWeek: "Wednesday" },
      system: { version: "1.0.0" },
    }),
    buildTaskBreakdownContext: vi.fn().mockResolvedValue({
      targetTask: {
        id: taskId,
        title: "Build Feature",
        description: "Implement feature with tests",
        priority: "HIGH",
        status: "TODO",
        dueDate: new Date("2026-08-20T10:00:00Z"),
        estimatedMinutes: 60,
        existingSubtasks: [],
      },
      user: {
        id: userId,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        role: "user",
        isEmailVerified: true,
        isActive: true,
      },
      settings: { timezone: "UTC" },
      time: { date: "2026-08-19", dayOfWeek: "Wednesday" },
      system: { version: "1.0.0" },
    }),
  };

  const mockTaskRepo: Partial<ITaskRepository> = {
    findById: vi.fn().mockResolvedValue({
      _id: taskId,
      title: "Build Feature",
      description: "Implement feature",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date(),
      estimatedMinutes: 60,
    }),
  };

  const createServiceWithProviderOutput = (jsonOutput: string) => {
    const mockProvider: AIProvider = {
      modelInformation: {
        provider: "Gemini",
        model: "gemini-3.5-flash",
        version: "1.0.0",
      },
      status: "healthy",
      generateText: vi.fn().mockResolvedValue({
        text: jsonOutput,
        finishReason: "STOP",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        model: {
          provider: "Gemini",
          model: "gemini-3.5-flash",
          version: "1.0.0",
        },
      }),
      healthCheck: vi.fn().mockResolvedValue({
        provider: "Gemini",
        model: "gemini-3.5-flash",
        status: "healthy",
        version: "1.0.0",
        isAvailable: true,
      }),
    };

    const pipeline = new AIPipeline({
      contextBuilder: mockContextBuilder as ContextBuilder,
      promptBuilder: new PromptBuilder(),
      aiProvider: mockProvider,
      responseParser: new ResponseParser(),
    });

    return { service: new AiService(pipeline, mockProvider, mockTaskRepo as ITaskRepository), mockProvider };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes Plan My Day successfully", async () => {
    const planDayJson = JSON.stringify({
      summary: "Focus on high-priority development today.",
      priorities: ["Build Feature"],
      schedule: [{ time: "09:00", task: "Build Feature" }],
      recommendations: ["Take regular breaks"],
      productivityScore: 88,
    });

    const { service } = createServiceWithProviderOutput(planDayJson);
    const result = await service.planDay(userId);

    expect(result.data.productivityScore).toBe(88);
    expect(result.data.schedule).toHaveLength(1);
    expect(result.metrics.provider).toBe("Gemini");
    expect(result.metrics.stageTimings?.llmTimeMs).toBeDefined();
    expect(notificationService.create).toHaveBeenCalled();
  });

  it("executes Task Breakdown successfully", async () => {
    const breakdownJson = JSON.stringify({
      summary: "Breakdown for Build Feature",
      estimatedMinutes: 60,
      subtasks: [
        {
          title: "Write unit tests",
          description: "Write tests first",
          priority: "HIGH",
          estimatedMinutes: 30,
        },
        {
          title: "Implement feature logic",
          description: "Write code",
          priority: "HIGH",
          estimatedMinutes: 30,
        },
      ],
    });

    const { service } = createServiceWithProviderOutput(breakdownJson);
    const result = await service.breakDownTask(taskId, userId);

    expect(result.data.subtasks).toHaveLength(2);
    expect(result.data.estimatedMinutes).toBe(60);
  });

  it("executes Task Prioritization successfully", async () => {
    const prioritizeJson = JSON.stringify({
      summary: "1 task prioritized",
      prioritizedTasks: [
        {
          taskId,
          title: "Build Feature",
          recommendedPriority: 1,
          reason: "Critical deliverable",
          urgency: "HIGH",
          estimatedFocusMinutes: 60,
        },
      ],
      recommendations: ["Start with high impact task"],
    });

    const { service } = createServiceWithProviderOutput(prioritizeJson);
    const result = await service.prioritizeTasks(userId);

    expect(result.data.prioritizedTasks).toHaveLength(1);
    expect(result.metrics.provider).toBe("Gemini");
    expect(result.metrics.model).toBe("gemini-3.5-flash");
  });

  it("executes Smart Reschedule successfully", async () => {
    const rescheduleJson = JSON.stringify({
      summary: "Tasks rearranged for maximum focus.",
      schedule: [
        {
          taskId,
          title: "Build Feature",
          time: "10:00",
          estimatedMinutes: 60,
          reason: "Morning focus block",
        },
      ],
      movedTasks: [],
      recommendations: ["Keep deep work undisturbed"],
      productivityScore: 85,
    });

    const { service } = createServiceWithProviderOutput(rescheduleJson);
    const result = await service.smartReschedule(userId);

    expect(result.data.productivityScore).toBe(85);
    expect(result.data.schedule).toHaveLength(1);
  });

  it("executes Weekly Review successfully", async () => {
    const weeklyReviewJson = JSON.stringify({
      summary: "Solid week with high throughput.",
      achievements: ["Delivered features"],
      insights: ["Morning sessions were most productive"],
      recommendations: ["Plan ahead for next week"],
      statistics: {
        completedTasks: 10,
        pendingTasks: 2,
        overdueTasks: 0,
        completionRate: 83,
        estimatedMinutesWorked: 600,
      },
      productivityScore: 92,
    });

    const { service } = createServiceWithProviderOutput(weeklyReviewJson);
    const result = await service.weeklyReview(userId);

    expect(result.data.productivityScore).toBe(92);
    expect(result.data.statistics.completionRate).toBe(83);
  });

  it("executes Productivity Insights successfully", async () => {
    const insightsJson = JSON.stringify({
      summary: "Strong analytical execution.",
      strengths: ["Consistently finishes tasks on time"],
      weaknesses: ["Occasional late night work"],
      patterns: ["High energy in the mornings"],
      recommendations: ["Maintain consistent sleep schedule"],
      statistics: {
        completionRate: 85,
        currentStreak: 5,
        longestStreak: 12,
        mostProductiveDay: "Wednesday",
        estimatedHoursWorked: 35.5,
      },
      productivityScore: 86,
    });

    const { service } = createServiceWithProviderOutput(insightsJson);
    const result = await service.productivityInsights(userId);

    expect(result.data.productivityScore).toBe(86);
    expect(result.data.strengths).toHaveLength(1);
    expect(result.data.patterns).toHaveLength(1);
    expect(result.data.statistics.currentStreak).toBe(5);
  });

  it("executes AI Assistant Chat successfully with safe user context", async () => {
    const chatJson = JSON.stringify({
      reply: "Hello Jane! You have 1 high priority task today: Build Feature.",
      suggestedActions: ["View Tasks", "Plan My Day"],
    });

    const { service } = createServiceWithProviderOutput(chatJson);
    const result = await service.chat(userId, "What is on my schedule today?");

    expect(result.data.reply).toContain("Hello Jane");
    expect(result.data.suggestedActions).toHaveLength(2);
  });

  it("returns comprehensive health status", async () => {
    const { service } = createServiceWithProviderOutput("{}");
    const health = await service.getHealth();

    expect(health.provider).toBe("Gemini");
    expect(health.model).toBe("gemini-3.5-flash");
    expect(health.isAvailable).toBe(true);
  });
});
