import type { AIExecutionMetrics } from "../ai/ai.types";

export type Conversation = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  _id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metrics?: AIExecutionMetrics;
  createdAt: string;
};

export type ChatResult = {
  conversation: Conversation;
  message: Message;
  suggestedActions: string[];
  metrics: AIExecutionMetrics;
};
