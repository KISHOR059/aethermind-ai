import { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { calendarKeys } from "@/features/calendar/calendar.hooks";
import { calendarService } from "@/features/calendar/calendar.service";
import type { CalendarEvent, CalendarEventsResult } from "@/features/calendar/calendar.types";
import { toDateOnly } from "@/features/calendar/calendar.utils";
import { notificationKeys } from "@/features/notifications/notification.hooks";
import { notificationService } from "@/features/notifications/notification.service";
import type { Notification, NotificationListData } from "@/features/notifications/notification.types";
import { taskKeys } from "@/features/tasks/task.hooks";
import { taskService } from "@/features/tasks/task.service";
import type { Task, TaskListData } from "@/features/tasks/task.types";

import type { AiDialogKind, PaletteCommand, RecentCommandEntry } from "./command-palette.types";

export type CommandPaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  recentCommands: RecentCommandEntry[];
  recentSearches: string[];
  registerRecentCommand: (command: PaletteCommand) => void;
  registerRecentSearch: (query: string) => void;
  clearRecentCommands: () => void;
  clearRecentSearches: () => void;
  openCreateTask: () => void;
  openAiDialog: (kind: AiDialogKind) => void;
  openTaskBreakdown: (taskId: string, taskTitle: string) => void;
};

export const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(
  undefined,
);

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}

const paletteKeys = {
  tasks: ["command-palette", "tasks"] as const,
  events: ["command-palette", "events"] as const,
  notifications: ["command-palette", "notifications"] as const,
};

const PALETTE_TASK_LIMIT = 100;
const EVENT_LOOKBACK_DAYS = 7;
const EVENT_LOOKAHEAD_DAYS = 60;

function dedupeTasks(tasks: readonly Task[]): Task[] {
  const seen = new Set<string>();
  const unique: Task[] = [];
  for (const task of tasks) {
    if (!seen.has(task.id)) {
      seen.add(task.id);
      unique.push(task);
    }
  }
  return unique;
}

function dedupeEvents(events: readonly CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  const unique: CalendarEvent[] = [];
  for (const event of events) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      unique.push(event);
    }
  }
  return unique;
}

function dedupeNotifications(
  notifications: readonly Notification[],
): Notification[] {
  const seen = new Set<string>();
  const unique: Notification[] = [];
  for (const notification of notifications) {
    if (!seen.has(notification.id)) {
      seen.add(notification.id);
      unique.push(notification);
    }
  }
  return unique;
}

/**
 * Client-side task index for the palette. Seeded from whatever task data is
 * already in the React Query cache (placeholderData), then topped up with a
 * single capped fetch that is cached and shared across palette opens.
 */
export function usePaletteTaskIndex(enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: paletteKeys.tasks,
    queryFn: () =>
      taskService.list({ page: 1, limit: PALETTE_TASK_LIMIT, sortBy: "createdAt", sortOrder: "desc" }),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: () => {
      const cached = queryClient
        .getQueriesData<TaskListData>({ queryKey: taskKeys.all })
        .flatMap(([, data]) => data?.items ?? []);
      const tasks = dedupeTasks(cached);
      return tasks.length > 0
        ? {
            items: tasks,
            pagination: { page: 1, limit: tasks.length, total: tasks.length, totalPages: 1 },
          }
        : undefined;
    },
  });
}

export function usePaletteEventIndex(enabled: boolean) {
  const queryClient = useQueryClient();

  const range = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - EVENT_LOOKBACK_DAYS);
    const end = new Date();
    end.setDate(end.getDate() + EVENT_LOOKAHEAD_DAYS);
    return { start: toDateOnly(start), end: toDateOnly(end) };
  }, []);

  return useQuery({
    queryKey: calendarKeys.range(range.start, range.end),
    queryFn: () => calendarService.getEvents({ startDate: range.start, endDate: range.end, view: "month" }),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: () => {
      const cached = queryClient
        .getQueriesData<CalendarEventsResult>({ queryKey: calendarKeys.all })
        .flatMap(([, data]) => data?.events ?? []);
      const events = dedupeEvents(cached);
      return events.length > 0
        ? { events, range: { start: range.start, end: range.end, view: "month" as const } }
        : undefined;
    },
  });
}

export function usePaletteNotificationIndex(enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: paletteKeys.notifications,
    queryFn: () => notificationService.list({ page: 1, limit: 100 }),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: () => {
      const cached = queryClient
        .getQueriesData<NotificationListData>({ queryKey: notificationKeys.all })
        .flatMap(([, data]) => data?.items ?? []);
      const notifications = dedupeNotifications(cached);
      return notifications.length > 0
        ? {
            items: notifications,
            pagination: {
              page: 1,
              limit: notifications.length,
              total: notifications.length,
              totalPages: 1,
            },
          }
        : undefined;
    },
  });
}
