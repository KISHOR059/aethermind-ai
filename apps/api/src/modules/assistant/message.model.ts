import { Schema, model, Types } from "mongoose";
import type { Document } from "mongoose";

export interface IMessageMetrics {
  executionTime?: number;
  provider?: string;
  model?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null;
  promptVersion?: string;
}

export interface IMessageDocument extends Document {
  conversationId: Types.ObjectId;
  owner: Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  metrics?: IMessageMetrics;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const MessageModel = model<IMessageDocument>(
  "Message",
  messageSchema,
);
