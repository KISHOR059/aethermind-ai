import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import type { AssistantService } from "./assistant.service.js";

export class AssistantController {
  public constructor(private readonly assistantService: AssistantService) {}

  public getConversations = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const conversations = await this.assistantService.getConversations(
      request.user.id,
    );

    successResponse(
      response,
      conversations,
      "Conversations retrieved successfully",
    );
  };

  public createConversation = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const { title } = (request.body ?? {}) as { title?: string };
    const conversation = await this.assistantService.createConversation(
      request.user.id,
      title,
    );

    successResponse(
      response,
      conversation,
      "Conversation created successfully",
      201,
    );
  };

  public updateConversation = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const { id } = request.params as { id: string };
    const { title } = request.body as { title: string };
    const conversation = await this.assistantService.updateConversation(
      request.user.id,
      id,
      title,
    );

    successResponse(
      response,
      conversation,
      "Conversation updated successfully",
    );
  };

  public deleteConversation = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const { id } = request.params as { id: string };
    await this.assistantService.deleteConversation(request.user.id, id);

    successResponse(response, null, "Conversation deleted successfully");
  };

  public getMessages = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const { id } = request.params as { id: string };
    const messages = await this.assistantService.getMessages(
      request.user.id,
      id,
    );

    successResponse(response, messages, "Messages retrieved successfully");
  };

  public chat = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const { conversationId, message } = request.body as {
      conversationId?: string;
      message: string;
    };

    const result = await this.assistantService.chat(
      request.user.id,
      message,
      conversationId,
    );

    successResponse(response, result, "Chat message processed successfully");
  };
}
