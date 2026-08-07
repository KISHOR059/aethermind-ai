import type { TaskPriority, TaskStatus } from "../tasks/task.model.js";

export enum CalendarView {
  MONTH = "month",
  WEEK = "week",
  DAY = "day",
}

export enum CalendarEventColor {
  HIGH = "#ef4444",
  URGENT = "#dc2626",
  MEDIUM = "#f59e0b",
  LOW = "#3b82f6",
  COMPLETED = "#22c55e",
}

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  taskId: string;
};

export type CalendarRange = {
  start: string;
  end: string;
  view: CalendarView;
};
