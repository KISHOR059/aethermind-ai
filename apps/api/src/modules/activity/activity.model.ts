import { HydratedDocument, model, Schema, Types } from "mongoose";

export type ActivityAction = "created" | "updated" | "completed" | "deleted";

export interface ActivityLog {
  owner: Types.ObjectId;
  taskId: string;
  taskTitle: string;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

const activityLogSchema = new Schema<ActivityLog>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: String, required: true, index: true },
    taskTitle: { type: String, required: true },
    action: { type: String, enum: ["created", "updated", "completed", "deleted"], required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ owner: 1, createdAt: -1 });

export const ActivityLogModel = model<ActivityLog>("ActivityLog", activityLogSchema);
