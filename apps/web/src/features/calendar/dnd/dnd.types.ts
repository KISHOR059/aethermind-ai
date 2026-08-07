import type { CalendarEvent } from "../calendar.types";
import { dateKey } from "../calendar.utils";

export const DND = {
  TASK: "calendar-task",
  DAY_DROP: "calendar-day-drop",
  TIME_DROP: "calendar-time-drop",
  ALL_DAY_DROP: "calendar-allday-drop",
} as const;

export type TaskDragData = { type: typeof DND.TASK; event: CalendarEvent };
export type DayDropData = { type: typeof DND.DAY_DROP; date: Date };
export type TimeDropData = { type: typeof DND.TIME_DROP; date: Date };
export type AllDayDropData = { type: typeof DND.ALL_DAY_DROP; date: Date };
export type DropTargetData = DayDropData | TimeDropData | AllDayDropData;

export type DropTargetKind = "day" | "time" | "allDay";

export type ActiveDrop = {
  containerId: string;
  type: DropTargetKind;
  date: Date;
};

export type SmartSuggestion = {
  taskId: string;
  title: string;
  suggestedDate: string;
  reason: string;
};

export type TimeGridHover = {
  containerId: string;
  minutes: number;
};

export const DAY_DROP_PREFIX = "day:";
export const TIME_DROP_PREFIX = "time:";
export const ALL_DAY_DROP_PREFIX = "allday:";

export function dayDropId(date: Date): string {
  return `${DAY_DROP_PREFIX}${dateKey(date)}`;
}

export function timeDropId(date: Date): string {
  return `${TIME_DROP_PREFIX}${dateKey(date)}`;
}

export function allDayDropId(date: Date): string {
  return `${ALL_DAY_DROP_PREFIX}${dateKey(date)}`;
}

export function parseDropId(id: string): {
  kind: DropTargetKind;
  dateKey: string;
} | null {
  if (id.startsWith(DAY_DROP_PREFIX))
    return { kind: "day", dateKey: id.slice(DAY_DROP_PREFIX.length) };
  if (id.startsWith(TIME_DROP_PREFIX))
    return { kind: "time", dateKey: id.slice(TIME_DROP_PREFIX.length) };
  if (id.startsWith(ALL_DAY_DROP_PREFIX))
    return { kind: "allDay", dateKey: id.slice(ALL_DAY_DROP_PREFIX.length) };
  return null;
}
