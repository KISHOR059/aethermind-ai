import type { UserRole } from "../../auth/user.model.js";
import type { TaskPriority, TaskStatus } from "../../tasks/task.model.js";

export type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate?: Date;
  readonly estimatedMinutes?: number;
};

export type TaskContext = {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly overdueTasks: number;
  readonly highPriorityTasks: number;
  readonly estimatedMinutes: number;
  readonly tasks: readonly TaskSummary[];
};

export type UserContext = {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly isEmailVerified: boolean;
  readonly isActive: boolean;
};

export type SettingsContext = {
  readonly locale: string;
  readonly timeZone: string;
  readonly weekStartsOn: "monday" | "sunday";
};

export type TimeContext = {
  readonly now: Date;
  readonly date: string;
  readonly timeZone: string;
  readonly dayOfWeek: string;
};

export type SystemContext = {
  readonly application: "AetherMind";
  readonly environment: string;
  readonly version: string;
};

export type DailyPlannerContext = {
  readonly user: UserContext;
  readonly tasks: TaskContext;
  readonly settings: SettingsContext;
  readonly time: TimeContext;
  readonly system: SystemContext;
};
