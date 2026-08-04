import { Types } from "mongoose";
import { ConversationModel } from "./conversation.model.js";
import { MessageModel, type IMessageMetrics } from "./message.model.js";

export class AssistantRepository {
  public async createConversation(ownerId: string, title?: string) {
    return ConversationModel.create({
      owner: new Types.ObjectId(ownerId),
      title: title || "New Conversation",
    });
  }

  public async getUserConversations(ownerId: string) {
    return ConversationModel.find({
      owner: new Types.ObjectId(ownerId),
      deletedAt: null,
    })
      .sort({ updatedAt: -1 })
      .exec();
  }

  public async getConversationById(ownerId: string, conversationId: string) {
    return ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      owner: new Types.ObjectId(ownerId),
      deletedAt: null,
    }).exec();
  }

  public async updateConversation(
    ownerId: string,
    conversationId: string,
    title: string,
  ) {
    return ConversationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(conversationId),
        owner: new Types.ObjectId(ownerId),
        deletedAt: null,
      },
      { $set: { title } },
      { new: true },
    ).exec();
  }

  public async deleteConversation(ownerId: string, conversationId: string) {
    const result = await ConversationModel.updateOne(
      {
        _id: new Types.ObjectId(conversationId),
        owner: new Types.ObjectId(ownerId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
    ).exec();

    if (result.modifiedCount === 1) {
      await MessageModel.deleteMany({
        conversationId: new Types.ObjectId(conversationId),
        owner: new Types.ObjectId(ownerId),
      }).exec();
      return true;
    }
    return false;
  }

  public async createMessage(
    ownerId: string,
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metrics?: IMessageMetrics,
  ) {
    const message = await MessageModel.create({
      owner: new Types.ObjectId(ownerId),
      conversationId: new Types.ObjectId(conversationId),
      role,
      content,
      metrics,
    });

    await ConversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $set: { updatedAt: new Date() } },
    ).exec();

    return message;
  }

  public async getMessagesByConversationId(
    ownerId: string,
    conversationId: string,
    limit = 50,
  ) {
    return MessageModel.find({
      conversationId: new Types.ObjectId(conversationId),
      owner: new Types.ObjectId(ownerId),
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }
}
