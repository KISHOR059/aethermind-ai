import type { TaskPriority, TaskStatus } from "@/features/tasks/task.types";

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

export type CalendarEventsResult = {
  events: CalendarEvent[];
  range: { start: string; end: string; view: "month" | "week" | "day" };
};

export type CalendarView = "month" | "week" | "day" | "agenda";

export type CalendarStatusFilter = "ALL" | "PENDING" | "COMPLETED" | "OVERDUE";
export type CalendarPriorityFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export type CalendarFilters = {
  search: string;
  status: CalendarStatusFilter;
  priority: CalendarPriorityFilter;
};

export type PriorityDotStyle = {
  dot: string;
  pill: string;
  label: string;
};

export const PRIORITY_STYLES: Record<TaskPriority, PriorityDotStyle> = {
  URGENT: {
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    label: "Urgent",
  },
  HIGH: {
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    label: "High",
  },
  MEDIUM: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    label: "Medium",
  },
  LOW: {
    dot: "bg-blue-500",
    pill: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    label: "Low",
  },
};

export const COMPLETED_STYLE: PriorityDotStyle = {
  dot: "bg-emerald-500",
  pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  label: "Completed",
};

export const OVERDUE_STYLE: PriorityDotStyle = {
  dot: "bg-rose-500",
  pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  label: "Overdue",
};

export const LEGEND_ITEMS = [
  { label: "High", dot: "bg-red-500" },
  { label: "Medium", dot: "bg-amber-500" },
  { label: "Low", dot: "bg-blue-500" },
  { label: "Completed", dot: "bg-emerald-500" },
  { label: "Overdue", dot: "bg-rose-500" },
] as const;
