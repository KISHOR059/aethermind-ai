import { Schema, model, Types } from "mongoose";
import type { Document } from "mongoose";

export interface IConversationDocument extends Document {
  owner: Types.ObjectId;
  title: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New Productivity Chat",
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ConversationModel = model<IConversationDocument>(
  "Conversation",
  conversationSchema,
);
