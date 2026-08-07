import {
  COMPLETED_STYLE,
  OVERDUE_STYLE,
  PRIORITY_STYLES,
  type CalendarEvent,
  type CalendarFilters,
  type PriorityDotStyle,
} from "./calendar.types";
import type { Task } from "@/features/tasks/task.types";

export const WEEKDAYS_SHORT = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
export const HOUR_START = 6;
export const HOUR_END = 22;
export const DAY_MS = 86_400_000;
export const MAX_VISIBLE_TASKS = 3;

export const EMPTY_EVENTS: CalendarEvent[] = [];

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addMonths(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateOnly(date: Date): string {
  return dateKey(date);
}

export function getMonthGrid(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeRange(event: CalendarEvent): string {
  const start = formatTime(new Date(event.start));
  if (event.allDay) return start;
  return `${start} – ${formatTime(new Date(event.end))}`;
}

export function isOverdueEvent(
  event: CalendarEvent,
  now = new Date(),
): boolean {
  return event.status !== "COMPLETED" && new Date(event.start) < now;
}

export function getEventStyle(
  event: CalendarEvent,
  now = new Date(),
): PriorityDotStyle {
  if (event.status === "COMPLETED") return COMPLETED_STYLE;
  if (isOverdueEvent(event, now)) return OVERDUE_STYLE;
  return PRIORITY_STYLES[event.priority];
}

export function matchesEventFilters(
  event: CalendarEvent,
  filters: CalendarFilters,
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const haystack = `${event.title} ${event.description ?? ""}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  switch (filters.status) {
    case "PENDING":
      if (event.status === "COMPLETED") return false;
      break;
    case "COMPLETED":
      if (event.status !== "COMPLETED") return false;
      break;
    case "OVERDUE":
      if (!isOverdueEvent(event)) return false;
      break;
    case "ALL":
      break;
  }

  switch (filters.priority) {
    case "HIGH":
      if (event.priority !== "HIGH" && event.priority !== "URGENT")
        return false;
      break;
    case "MEDIUM":
      if (event.priority !== "MEDIUM") return false;
      break;
    case "LOW":
      if (event.priority !== "LOW") return false;
      break;
    case "ALL":
      break;
  }

  return true;
}

export function groupEventsByDay(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.start));
    const bucket = grouped.get(key);
    if (bucket) bucket.push(event);
    else grouped.set(key, [event]);
  }
  return grouped;
}

export function eventToTask(event: CalendarEvent): Task {
  return {
    id: event.taskId,
    title: event.title,
    description: event.description,
    status: event.status,
    priority: event.priority,
    dueDate: event.start,
    startDate: undefined,
    estimatedMinutes: undefined,
    completedAt: undefined,
    tags: [],
    owner: "",
    createdAt: event.start,
    updatedAt: event.start,
  };
}

export function getEventPosition(event: CalendarEvent): {
  top: number;
  height: number;
} {
  const start = new Date(event.start);
  const end = event.allDay
    ? new Date(start.getTime() + 60 * 60_000)
    : new Date(event.end);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = Math.max(
    end.getHours() * 60 + end.getMinutes(),
    startMinutes + 30,
  );

  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const top = ((startMinutes - HOUR_START * 60) / totalMinutes) * 100;
  const height = ((endMinutes - startMinutes) / totalMinutes) * 100;

  return {
    top: Math.min(Math.max(top, 0), 100),
    height: Math.min(Math.max(height, 2), 100 - top),
  };
}

export function hasActiveCalendarFilters(filters: CalendarFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== "ALL" ||
    filters.priority !== "ALL"
  );
}
