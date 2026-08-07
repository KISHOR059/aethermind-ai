import type { AIPipeline } from "./pipeline/ai-pipeline.js";
import type { AIExecutionResult } from "./pipeline/pipeline.types.js";
import type {
  AssistantChatResponse,
  DailyPlannerResponse,
  ProductivityInsightsResponse,
  SmartRescheduleResponse,
  TaskBreakdownResponse,
  TaskPrioritizationResponse,
  WeeklyReviewResponse,
} from "./parser/schemas/index.js";
import type { AIProvider } from "./providers/ai-provider.interface.js";
import type { ProviderStatus } from "./providers/types.js";
import { TaskRepository } from "../tasks/task.repository.js";
import type { ITaskRepository } from "../tasks/task.repository.interface.js";
import { NotFoundError } from "../../utils/app-error.js";
import { notificationService } from "../notifications/index.js";
import {
  NotificationType,
  NotificationPriority,
} from "../notifications/notification.types.js";
import type { CreateNotificationData } from "../notifications/notification.repository.interface.js";

export type AiHealth = {
  provider: string;
  model: string;
  status: ProviderStatus;
  version: string;
};

export class AiService {
  private readonly taskRepository: ITaskRepository;

  public constructor(
    private readonly aiPipeline: AIPipeline,
    private readonly aiProvider: AIProvider,
    taskRepository?: ITaskRepository,
  ) {
    this.taskRepository = taskRepository ?? new TaskRepository();
  }

  public getHealth(): AiHealth {
    return {
      provider: this.aiProvider.modelInformation.provider,
      model: this.aiProvider.modelInformation.model,
      status: this.aiProvider.status,
      version: this.aiProvider.modelInformation.version,
    };
  }

  public async planDay(
    userId: string,
  ): Promise<AIExecutionResult<DailyPlannerResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "daily-planner",
      userId,
    });

    this.notify(userId, {
      title: "Daily Plan Generated",
      message: `Your daily plan is ready with a productivity score of ${result.data.productivityScore}/100`,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        productivityScore: result.data.productivityScore,
        scheduleItems: result.data.schedule.length,
        priorityTasks: result.data.priorities.length,
      },
    });

    return result;
  }

  public async breakDownTask(
    taskId: string,
    userId: string,
  ): Promise<AIExecutionResult<TaskBreakdownResponse>> {
    const task = await this.taskRepository.findById(userId, taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const result = await this.aiPipeline.execute({
      prompt: "task-breakdown",
      userId,
      taskId,
    });

    this.notify(userId, {
      title: "Task Breakdown Ready",
      message: `Your task has been broken down into ${result.data.subtasks.length} subtasks`,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        taskId,
        taskTitle: task.title,
        subtaskCount: result.data.subtasks.length,
        estimatedMinutes: result.data.estimatedMinutes,
      },
    });

    return result;
  }

  public async prioritizeTasks(
    userId: string,
  ): Promise<AIExecutionResult<TaskPrioritizationResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "task-prioritization",
      userId,
    });

    this.notify(userId, {
      title: "Task Prioritization Complete",
      message: `${result.data.prioritizedTasks.length} tasks analyzed and prioritized`,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        taskCount: result.data.prioritizedTasks.length,
        recommendationsCount: result.data.recommendations.length,
      },
    });

    return result;
  }

  public async smartReschedule(
    userId: string,
  ): Promise<AIExecutionResult<SmartRescheduleResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "smart-reschedule",
      userId,
    });

    this.notify(userId, {
      title: "Smart Reschedule Complete",
      message: result.data.summary,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/tasks",
      metadata: {
        movedTasks: result.data.movedTasks.length,
        scheduleItems: result.data.schedule.length,
        productivityScore: result.data.productivityScore,
      },
    });

    return result;
  }

  public async weeklyReview(
    userId: string,
  ): Promise<AIExecutionResult<WeeklyReviewResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "weekly-review",
      userId,
    });

    this.notify(userId, {
      title: "Weekly Review Generated",
      message: `Your weekly productivity score: ${result.data.productivityScore}/100`,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/dashboard",
      metadata: {
        productivityScore: result.data.productivityScore,
        completionRate: result.data.statistics.completionRate,
        completedTasks: result.data.statistics.completedTasks,
        overdueTasks: result.data.statistics.overdueTasks,
      },
    });

    return result;
  }

  public async productivityInsights(
    userId: string,
  ): Promise<AIExecutionResult<ProductivityInsightsResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "productivity-insights",
      userId,
    });

    this.notify(userId, {
      title: "Productivity Insights Ready",
      message: `AI analysis complete with productivity score: ${result.data.productivityScore}/100`,
      type: NotificationType.AI,
      priority: NotificationPriority.NORMAL,
      actionUrl: "/dashboard",
      metadata: {
        productivityScore: result.data.productivityScore,
        strengthsCount: result.data.strengths.length,
        weaknessesCount: result.data.weaknesses.length,
      },
    });

    return result;
  }

  public async chat(
    userId: string,
    userMessage: string,
    conversationHistory?: string,
  ): Promise<AIExecutionResult<AssistantChatResponse>> {
    const result = await this.aiPipeline.execute({
      prompt: "assistant-chat",
      userId,
      userMessage,
      conversationHistory,
    });

    if (result.data.suggestedActions.length > 0) {
      this.notify(userId, {
        title: "AI Assistant Suggestion",
        message: result.data.suggestedActions[0],
        type: NotificationType.AI,
        priority: NotificationPriority.LOW,
        actionUrl: "/assistant",
        metadata: { suggestedActions: result.data.suggestedActions },
      });
    }

    return result;
  }

  private notify(userId: string, data: CreateNotificationData): void {
    void notificationService.create(userId, data);
  }
}
