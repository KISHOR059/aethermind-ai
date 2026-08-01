import { HydratedDocument, model, Schema, Types } from "mongoose";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Task {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedMinutes?: number;
  completedAt?: Date;
  tags: string[];
  owner: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDocument = HydratedDocument<Task>;

const taskSchema = new Schema<Task>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    dueDate: { type: Date },
    startDate: { type: Date },
    estimatedMinutes: { type: Number, min: 1 },
    completedAt: { type: Date },
    tags: { type: [String], default: [] },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ owner: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ owner: 1, deletedAt: 1 });

export const TaskModel = model<Task>("Task", taskSchema);
