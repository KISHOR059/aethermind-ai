import type { ApiSuccess } from "@/shared/types/api";
import apiClient from "@/shared/lib/api-client";
import { AI_REQUEST_TIMEOUT_MS } from "../ai/ai.service";
import type { ChatResult, Conversation, Message } from "./assistant.types";

export const assistantService = {
  getConversations: async () => {
    const response = await apiClient.get<ApiSuccess<Conversation[]>>(
      "/assistant/conversations",
    );
    return response.data.data;
  },

  createConversation: async (title?: string) => {
    const response = await apiClient.post<ApiSuccess<Conversation>>(
      "/assistant/conversations",
      { title },
    );
    return response.data.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await apiClient.get<ApiSuccess<Message[]>>(
      `/assistant/conversations/${conversationId}/messages`,
    );
    return response.data.data;
  },

  renameConversation: async (conversationId: string, title: string) => {
    const response = await apiClient.patch<ApiSuccess<Conversation>>(
      `/assistant/conversations/${conversationId}`,
      { title },
    );
    return response.data.data;
  },

  deleteConversation: async (conversationId: string) => {
    const response = await apiClient.delete<ApiSuccess<null>>(
      `/assistant/conversations/${conversationId}`,
    );
    return response.data.data;
  },

  sendMessage: async (message: string, conversationId?: string) => {
    const response = await apiClient.post<ApiSuccess<ChatResult>>(
      "/ai/chat",
      { message, conversationId },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },
};
