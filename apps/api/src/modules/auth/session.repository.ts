import { SessionModel, type SessionDocument } from "./session.model.js";
import type {
  CreateSessionData,
  ISessionRepository,
  RotateSessionData,
} from "./session.repository.interface.js";

export class SessionRepository implements ISessionRepository {
  public async create(data: CreateSessionData): Promise<SessionDocument> {
    return SessionModel.create(data);
  }

  public async findById(id: string): Promise<SessionDocument | null> {
    return SessionModel.findById(id).exec();
  }

  public async findActiveByUserId(userId: string): Promise<SessionDocument[]> {
    const now = new Date();

    return SessionModel.find({
      userId,
      revokedAt: null,
      absoluteExpiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async rotateRefreshToken(
    id: string,
    previousHash: string,
    data: RotateSessionData,
  ): Promise<SessionDocument | null> {
    return SessionModel.findOneAndUpdate(
      { _id: id, refreshTokenHash: previousHash },
      data,
      { returnDocument: "after" },
    ).exec();
  }

  public async revoke(id: string): Promise<SessionDocument | null> {
    return SessionModel.findByIdAndUpdate(
      id,
      { revokedAt: new Date() },
      { returnDocument: "after" },
    ).exec();
  }

  public async revokeAllByUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const filter: Record<string, unknown> = {
      userId,
      revokedAt: null,
    };

    if (exceptSessionId) {
      filter._id = { $ne: exceptSessionId };
    }

    const result = await SessionModel.updateMany(filter, {
      revokedAt: new Date(),
    }).exec();

    return result.modifiedCount;
  }
}
