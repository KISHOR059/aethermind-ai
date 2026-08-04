import type { AiService } from "../ai/ai.service.js";
import { AssistantRepository } from "./assistant.repository.js";

export class AssistantService {
  private readonly repository: AssistantRepository;

  public constructor(
    private readonly aiService: AiService,
    repository?: AssistantRepository,
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
