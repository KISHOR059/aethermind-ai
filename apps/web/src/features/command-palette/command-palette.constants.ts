import {
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  Bot,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  Flame,
  History,
  LayoutDashboard,
  ListTodo,
  ListTree,
  Palette,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CommandGroupId, PaletteCommand } from "./command-palette.types";

export const COMMAND_PALETTE_STORAGE_KEYS = {
  recentCommands: "aethermind:command-palette:recent-commands",
  recentSearches: "aethermind:command-palette:recent-searches",
} as const;

export const RECENT_COMMANDS_LIMIT = 10;
export const RECENT_SEARCHES_LIMIT = 10;
export const MAX_RESULTS_PER_GROUP = 6;
export const PICKER_RESULTS_LIMIT = 12;
export const COMMAND_LIST_ID = "command-palette-list";

export const GROUP_LABELS: Record<CommandGroupId, string> = {
  "recent-searches": "Recent Searches",
  recent: "Recent",
  navigation: "Navigation",
  tasks: "Tasks",
  calendar: "Calendar",
  ai: "AI",
  notifications: "Notifications",
  settings: "Settings",
};

export const GROUP_ORDER: Record<CommandGroupId, number> = {
  "recent-searches": 0,
  recent: 1,
  navigation: 2,
  tasks: 3,
  calendar: 4,
  ai: 5,
  notifications: 6,
  settings: 7,
};

export const GROUP_ICONS: Record<CommandGroupId, LucideIcon> = {
  "recent-searches": History,
  recent: History,
  navigation: LayoutDashboard,
  tasks: CheckSquare,
  calendar: CalendarDays,
  ai: Sparkles,
  notifications: Bell,
  settings: Settings,
};

export const NAVIGATION_COMMANDS: PaletteCommand[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    group: "navigation",
    icon: LayoutDashboard,
    route: "/dashboard",
    keywords: ["home", "overview", "analytics"],
  },
  {
    id: "nav-tasks",
    label: "Tasks",
    group: "navigation",
    icon: CheckSquare,
    route: "/tasks",
    keywords: ["todo", "todos", "to-do"],
  },
  {
    id: "nav-calendar",
    label: "Calendar",
    group: "navigation",
    icon: CalendarDays,
    route: "/calendar",
    keywords: ["schedule", "agenda"],
  },
  {
    id: "nav-notifications",
    label: "Notifications",
    group: "navigation",
    icon: Bell,
    action: "open-notifications",
    keywords: ["alerts", "bell", "inbox"],
  },
  {
    id: "nav-ai-assistant",
    label: "AI Assistant",
    group: "navigation",
    icon: Bot,
    route: "/assistant",
    keywords: ["chat", "coach", "ai", "assistant"],
  },
  {
    id: "nav-settings",
    label: "Settings",
    group: "navigation",
    icon: Settings,
    route: "/settings",
    keywords: ["preferences", "account", "options"],
  },
];

export const TASK_COMMANDS: PaletteCommand[] = [
  {
    id: "task-create",
    label: "Create Task",
    group: "tasks",
    icon: Plus,
    action: "create-task",
    keywords: ["new", "add", "todo", "quick add"],
  },
  {
    id: "task-search",
    label: "Search Tasks",
    group: "tasks",
    icon: Search,
    action: "search-tasks",
    keywords: ["find", "filter", "lookup"],
  },
  {
    id: "task-completed",
    label: "Completed Tasks",
    group: "tasks",
    icon: CheckCircle2,
    route: "/tasks?status=COMPLETED",
    keywords: ["done", "finished", "closed"],
  },
  {
    id: "task-overdue",
    label: "Overdue Tasks",
    group: "tasks",
    icon: AlertTriangle,
    route: "/tasks?status=OVERDUE",
    keywords: ["late", "missed", "delayed", "past due"],
  },
  {
    id: "task-today",
    label: "Today's Tasks",
    group: "tasks",
    icon: CalendarCheck2,
    route: "/tasks?dueToday=1",
    keywords: ["due today", "deadline today", "today"],
  },
  {
    id: "task-high-priority",
    label: "High Priority Tasks",
    group: "tasks",
    icon: Flame,
    route: "/tasks?priority=HIGH",
    keywords: ["urgent", "important", "critical"],
  },
  {
    id: "task-pending",
    label: "Pending Tasks",
    group: "tasks",
    icon: ListTodo,
    route: "/tasks?status=TODO",
    keywords: ["open", "incomplete", "unfinished", "pending"],
  },
];

export const CALENDAR_COMMANDS: PaletteCommand[] = [
  {
    id: "calendar-open",
    label: "Open Calendar",
    group: "calendar",
    icon: CalendarDays,
    route: "/calendar",
    keywords: ["schedule", "agenda", "calendar"],
  },
];

export const AI_COMMANDS: PaletteCommand[] = [
  {
    id: "ai-plan-day",
    label: "Plan My Day",
    group: "ai",
    icon: Sparkles,
    action: "plan-my-day",
    keywords: ["plan", "schedule", "daily", "day"],
  },
  {
    id: "ai-weekly-review",
    label: "Weekly Review",
    group: "ai",
    icon: BarChart3,
    action: "weekly-review",
    keywords: ["review", "summary", "week", "report"],
  },
  {
    id: "ai-task-breakdown",
    label: "Task Breakdown",
    group: "ai",
    icon: ListTree,
    action: "task-breakdown",
    keywords: ["breakdown", "subtasks", "decompose", "split"],
  },
  {
    id: "ai-prioritization",
    label: "Task Prioritization",
    group: "ai",
    icon: Target,
    action: "task-prioritization",
    keywords: ["prioritize", "priority", "rank", "order"],
  },
  {
    id: "ai-smart-reschedule",
    label: "Smart Reschedule",
    group: "ai",
    icon: CalendarClock,
    action: "smart-reschedule",
    keywords: ["reschedule", "replan", "move", "shift"],
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    group: "ai",
    icon: Bot,
    route: "/assistant",
    keywords: ["chat", "ask", "coach", "ai"],
  },
];

export const NOTIFICATION_COMMANDS: PaletteCommand[] = [
  {
    id: "notify-open",
    label: "Open Notifications",
    group: "notifications",
    icon: Bell,
    action: "open-notifications",
    keywords: ["alerts", "bell", "inbox"],
  },
  {
    id: "notify-unread",
    label: "Unread Notifications",
    group: "notifications",
    icon: BellRing,
    action: "notifications-unread",
    keywords: ["unread", "new", "pending"],
  },
  {
    id: "notify-mark-all-read",
    label: "Mark All Read",
    group: "notifications",
    icon: CheckCheck,
    action: "mark-all-read",
    keywords: ["read", "clear", "dismiss", "all read"],
  },
];

export const SETTINGS_COMMANDS: PaletteCommand[] = [
  {
    id: "settings-open",
    label: "Open Settings",
    group: "settings",
    icon: Settings,
    route: "/settings",
    keywords: ["preferences", "account", "options"],
  },
  {
    id: "settings-theme",
    label: "Theme",
    group: "settings",
    icon: Palette,
    action: "cycle-theme",
    keywords: ["dark", "light", "mode", "appearance", "color"],
  },
  {
    id: "settings-profile",
    label: "Profile",
    group: "settings",
    icon: User,
    route: "/settings",
    keywords: ["account", "user", "name", "email"],
  },
  {
    id: "settings-preferences",
    label: "Preferences",
    group: "settings",
    icon: SlidersHorizontal,
    route: "/settings",
    keywords: ["settings", "customize", "options"],
  },
];

export const STATIC_COMMAND_GROUPS: CommandGroupId[] = [
  "navigation",
  "tasks",
  "calendar",
  "ai",
  "notifications",
  "settings",
];
