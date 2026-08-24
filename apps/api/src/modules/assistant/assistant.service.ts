import type { AiService } from "../ai/ai.service.js";
import type { TaskService } from "../tasks/task.service.js";
import { AssistantRepository } from "./assistant.repository.js";
import { TaskPriority, TaskStatus } from "../tasks/task.model.js";
import type { PublicUser } from "../auth/auth.types.js";
import { logger } from "../../lib/logger.js";

export class AssistantService {
  private readonly repository: AssistantRepository;

  public constructor(
    private readonly aiService: AiService,
    repository?: AssistantRepository,
    private readonly taskService?: TaskService,
  ) {
    this.repository = repository ?? new AssistantRepository();
  }

  public async getConversations(ownerId: string) {
    return this.repository.getUserConversations(ownerId);
  }

  public async createConversation(ownerId: string, title?: string) {
    return this.repository.createConversation(ownerId, title);
  }

  public async getConversation(ownerId: string, conversationId: string) {
    return this.repository.getConversationById(ownerId, conversationId);
  }

  public async updateConversation(
    ownerId: string,
    conversationId: string,
    title: string,
  ) {
    return this.repository.updateConversation(ownerId, conversationId, title);
  }

  public async deleteConversation(ownerId: string, conversationId: string) {
    return this.repository.deleteConversation(ownerId, conversationId);
  }

  public async getMessages(ownerId: string, conversationId: string) {
    return this.repository.getMessagesByConversationId(ownerId, conversationId);
  }

  public async chat(
    ownerId: string,
    userMessageContent: string,
    conversationId?: string,
  ) {
    let conversation;

    if (conversationId) {
      conversation = await this.repository.getConversationById(
        ownerId,
        conversationId,
      );
    }

    if (!conversation) {
      const derivedTitle =
        userMessageContent.length > 30
          ? `${userMessageContent.slice(0, 30)}...`
          : userMessageContent;
      conversation = await this.repository.createConversation(
        ownerId,
        derivedTitle,
      );
    }

    // Save user message to database
    await this.repository.createMessage(
      ownerId,
      String(conversation._id),
      "user",
      userMessageContent,
    );

    // Fetch conversation history for prompt context
    const previousMessages = await this.repository.getMessagesByConversationId(
      ownerId,
      String(conversation._id),
      15,
    );

    const historyStr = previousMessages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    // Execute AI Pipeline
    const executionResult = await this.aiService.chat(
      ownerId,
      userMessageContent,
      historyStr,
    );

    const replyContent = executionResult.data.reply;

    // Handle taskAction if present (e.g. creating task with specific datetime)
    const taskAction = executionResult.data.taskAction;
    if (
      taskAction &&
      taskAction.action === "CREATE" &&
      taskAction.title &&
      this.taskService
    ) {
      try {
        const priority =
          taskAction.priority &&
          Object.values(TaskPriority).includes(taskAction.priority as TaskPriority)
            ? (taskAction.priority as TaskPriority)
            : TaskPriority.MEDIUM;

        const dueDate = taskAction.dueDate
          ? new Date(taskAction.dueDate)
          : undefined;

        await this.taskService.create(
          { id: ownerId } as PublicUser,
          {
            title: taskAction.title,
            dueDate,
            priority,
            status: TaskStatus.TODO,
            tags: [],
            estimatedMinutes: taskAction.estimatedMinutes,
          },
        );
      } catch (err) {
        logger.error("Failed to execute AI task action", {
          error: err instanceof Error ? err.message : String(err),
          taskAction,
        });
      }
    }

    // Save assistant message to database
    const assistantMessage = await this.repository.createMessage(
      ownerId,
      String(conversation._id),
      "assistant",
      replyContent,
      executionResult.metrics,
    );

    return {
      conversation,
      message: assistantMessage,
      suggestedActions: executionResult.data.suggestedActions ?? [],
      metrics: executionResult.metrics,
    };
  }
}
