import type { HydratedDocument, Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface Session {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}

export type SessionDocument = HydratedDocument<Session>;

const sessionSchema = new Schema<Session>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    absoluteExpiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, lastActivityAt: -1 });
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<Session>("Session", sessionSchema);
