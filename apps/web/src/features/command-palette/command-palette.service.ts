import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Search,
  Bell,
  BellRing,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CalendarEvent } from "@/features/calendar/calendar.types";
import type { Notification } from "@/features/notifications/notification.types";
import type { Task } from "@/features/tasks/task.types";

import {
  COMMAND_PALETTE_STORAGE_KEYS,
  GROUP_ICONS,
  GROUP_LABELS,
  GROUP_ORDER,
  MAX_RESULTS_PER_GROUP,
  RECENT_COMMANDS_LIMIT,
  RECENT_SEARCHES_LIMIT,
} from "./command-palette.constants";
import type {
  CommandContext,
  CommandGroupId,
  CommandGroupView,
  CommandItemData,
  FuzzyMatch,
  PaletteAction,
  PaletteCommand,
  RecentCommandEntry,
} from "./command-palette.types";

export type FuzzyMatchResult = { score: number; indices: number[] };

function isRecentCommandEntry(value: unknown): value is RecentCommandEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<RecentCommandEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.group === "string"
  );
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode / SSR) - non-fatal.
  }
}

export function loadRecentCommands(): RecentCommandEntry[] {
  const entries = readJson<unknown>(COMMAND_PALETTE_STORAGE_KEYS.recentCommands);
  if (!Array.isArray(entries)) return [];
  return entries.filter(isRecentCommandEntry);
}

export function saveRecentCommand(entry: RecentCommandEntry): RecentCommandEntry[] {
  const next = [
    entry,
    ...loadRecentCommands().filter((existing) => existing.id !== entry.id),
  ].slice(0, RECENT_COMMANDS_LIMIT);
  writeJson(COMMAND_PALETTE_STORAGE_KEYS.recentCommands, next);
  return next;
}

export function clearRecentCommands() {
  writeJson(COMMAND_PALETTE_STORAGE_KEYS.recentCommands, []);
}

export function loadRecentSearches(): string[] {
  const entries = readJson<unknown>(COMMAND_PALETTE_STORAGE_KEYS.recentSearches);
  return Array.isArray(entries) ? entries.filter((entry): entry is string => typeof entry === "string") : [];
}

export function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches();
  const next = [
    trimmed,
    ...loadRecentSearches().filter(
      (existing) => existing.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, RECENT_SEARCHES_LIMIT);
  writeJson(COMMAND_PALETTE_STORAGE_KEYS.recentSearches, next);
  return next;
}

export function clearRecentSearches() {
  writeJson(COMMAND_PALETTE_STORAGE_KEYS.recentSearches, []);
}

/**
 * Lightweight local fuzzy matcher (subsequence scoring with word-start,
 * consecutive-run and prefix bonuses). No external dependency and no
 * debounce needed - fast enough to run synchronously on every keystroke.
 */
export function fuzzySearch(query: string, text: string): FuzzyMatchResult | null {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  if (!normalizedQuery || normalizedQuery.length > normalizedText.length) return null;

  let cursor = 0;
  let score = 0;
  const indices: number[] = [];
  let previousIndex = -2;

  for (let queryIndex = 0; queryIndex < normalizedQuery.length; queryIndex += 1) {
    const char = normalizedQuery[queryIndex];
    let found = -1;

    for (let textIndex = cursor; textIndex < normalizedText.length; textIndex += 1) {
      if (normalizedText[textIndex] === char) {
        found = textIndex;
        break;
      }
    }

    if (found === -1) return null;

    const isConsecutive = found === previousIndex + 1;
    const isWordStart =
      found === 0 ||
      normalizedText[found - 1] === " " ||
      normalizedText[found - 1] === "-" ||
      normalizedText[found - 1] === "_";

    score += 2;
    if (isConsecutive) score += 4;
    if (isWordStart) score += 6;
    if (found - cursor <= 2) score += 1;

    indices.push(found);
    previousIndex = found;
    cursor = found + 1;
  }

  if (normalizedText.startsWith(normalizedQuery)) score += 20;
  score -= Math.max(0, text.length - normalizedQuery.length) * 0.5;

  return { score, indices };
}

export function matchCommand(command: PaletteCommand, query: string): FuzzyMatch | null {
  const labelMatch = fuzzySearch(query, command.label);
  let best: FuzzyMatch | null = labelMatch ? { ...labelMatch, onLabel: true } : null;

  for (const keyword of command.keywords ?? []) {
    const keywordMatch = fuzzySearch(query, keyword);
    if (keywordMatch && (!best || keywordMatch.score > best.score)) {
      best = { ...keywordMatch, onLabel: false };
    }
  }

  return best;
}

export function groupFilteredCommands(
  commands: readonly PaletteCommand[],
  query: string,
  maxPerGroup = MAX_RESULTS_PER_GROUP,
): CommandGroupView[] {
  const ranked = commands
    .map((command) => ({ command, match: matchCommand(command, query) }))
    .filter((entry): entry is { command: PaletteCommand; match: FuzzyMatch } => entry.match !== null)
    .sort((a, b) => b.match.score - a.match.score);

  const grouped = new Map<CommandGroupId, CommandItemData[]>();

  for (const { command, match } of ranked) {
    const items = grouped.get(command.group) ?? [];
    if (items.length >= maxPerGroup) continue;
    items.push({ command, score: match.score, indices: match.indices, onLabel: match.onLabel });
    grouped.set(command.group, items);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => GROUP_ORDER[a[0]] - GROUP_ORDER[b[0]])
    .map(([id, items]) => ({ id, label: GROUP_LABELS[id], items }));
}

export function buildHighlightSegments(
  label: string,
  indices: readonly number[],
): Array<{ text: string; highlighted: boolean }> {
  if (indices.length === 0) return [{ text: label, highlighted: false }];

  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;

  for (const index of sorted) {
    if (index < cursor || index >= label.length) continue;
    if (index > cursor) {
      segments.push({ text: label.slice(cursor, index), highlighted: false });
    }
    segments.push({ text: label[index], highlighted: true });
    cursor = index + 1;
  }

  if (cursor < label.length) {
    segments.push({ text: label.slice(cursor), highlighted: false });
  }

  return segments;
}

export function toRecentEntry(command: PaletteCommand): RecentCommandEntry {
  return {
    id: command.id,
    label: command.label,
    group: command.group,
    route: command.route,
    action: command.action,
  };
}

export function shouldPersistRecent(command: PaletteCommand): boolean {
  return (
    command.action !== "task-breakdown-pick" &&
    (Boolean(command.route) || Boolean(command.action))
  );
}

export function resolveExecutor(command: {
  route?: string;
  action?: PaletteAction;
}): (context: CommandContext) => void {
  if (command.route) {
    return (context) => context.navigate(command.route as string);
  }

  switch (command.action) {
    case "create-task":
      return (context) => context.openCreateTask();
    case "search-tasks":
      return (context) => {
        const search = context.query.trim();
        context.navigate(search ? `/tasks?search=${encodeURIComponent(search)}` : "/tasks");
      };
    case "plan-my-day":
      return (context) => context.openAiDialog("plan-my-day");
    case "weekly-review":
      return (context) => context.openAiDialog("weekly-review");
    case "task-breakdown":
      return (context) => context.startTaskBreakdown();
    case "task-breakdown-pick":
      return (context) => {
        const target = (command as PaletteCommand).data;
        if (target) context.openTaskBreakdown(target.taskId, target.taskTitle);
      };
    case "task-prioritization":
      return (context) => context.openAiDialog("task-prioritization");
    case "smart-reschedule":
      return (context) => context.openAiDialog("smart-reschedule");
    case "open-notifications":
      return (context) => context.openNotifications();
    case "notifications-unread":
      return (context) => context.openNotifications("UNREAD");
    case "mark-all-read":
      return (context) => context.markAllRead();
    case "cycle-theme":
      return (context) => context.cycleTheme();
    default:
      return () => {};
  }
}

export function iconForGroup(group: CommandGroupId): LucideIcon {
  return GROUP_ICONS[group] ?? Search;
}

function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function buildCalendarCommands(): PaletteCommand[] {
  const today = new Date();
  return [
    {
      id: "calendar-today",
      label: "Today",
      group: "calendar",
      icon: CalendarClock,
      route: `/calendar?date=${toDateParam(today)}`,
      keywords: ["today", "current", "now"],
    },
    {
      id: "calendar-next-week",
      label: "Next Week",
      group: "calendar",
      icon: CalendarRange,
      route: `/calendar?view=week&date=${toDateParam(addDays(today, 7))}`,
      keywords: ["upcoming", "next", "ahead"],
    },
    {
      id: "calendar-month-view",
      label: "Month View",
      group: "calendar",
      icon: CalendarDays,
      route: "/calendar?view=month",
      keywords: ["month", "monthly"],
    },
    {
      id: "calendar-week-view",
      label: "Week View",
      group: "calendar",
      icon: CalendarRange,
      route: "/calendar?view=week",
      keywords: ["week", "weekly"],
    },
    {
      id: "calendar-day-view",
      label: "Day View",
      group: "calendar",
      icon: CalendarClock,
      route: "/calendar?view=day",
      keywords: ["day", "daily"],
    },
  ];
}

function formatPriority(priority: Task["priority"]): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function buildTaskCommands(tasks: readonly Task[]): PaletteCommand[] {
  return tasks.map((task) => ({
    id: `task:${task.id}`,
    label: task.title,
    group: "tasks",
    icon: CheckSquare,
    hint: formatPriority(task.priority),
    route: `/tasks?task=${encodeURIComponent(task.id)}`,
    keywords: [task.title, ...task.tags],
  }));
}

export function buildTaskBreakdownCommands(tasks: readonly Task[]): PaletteCommand[] {
  return tasks.map((task) => ({
    id: `task-breakdown:${task.id}`,
    label: task.title,
    group: "tasks",
    icon: CheckSquare,
    hint: formatPriority(task.priority),
    action: "task-breakdown-pick",
    data: { taskId: task.id, taskTitle: task.title },
    keywords: [task.title, ...task.tags],
  }));
}

export function buildEventCommands(events: readonly CalendarEvent[]): PaletteCommand[] {
  return events.map((event) => ({
    id: `event:${event.id}`,
    label: event.title,
    group: "calendar",
    icon: CalendarDays,
    hint: toDateParam(new Date(event.start)),
    route: `/calendar?view=day&date=${toDateParam(new Date(event.start))}`,
    keywords: [event.title],
  }));
}

export function buildNotificationCommands(
  notifications: readonly Notification[],
): PaletteCommand[] {
  return notifications.map((notification) => ({
    id: `notification:${notification.id}`,
    label: notification.title,
    group: "notifications",
    icon: notification.isRead ? Bell : BellRing,
    hint: notification.isRead ? undefined : "Unread",
    action: "open-notifications",
    keywords: [notification.title, notification.message],
  }));
}
