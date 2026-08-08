import type { LucideIcon } from "lucide-react";

export const COMMAND_GROUPS = [
  "recent-searches",
  "recent",
  "navigation",
  "tasks",
  "calendar",
  "ai",
  "notifications",
  "settings",
] as const;

export type CommandGroupId = (typeof COMMAND_GROUPS)[number];

export type AiDialogKind =
  | "plan-my-day"
  | "weekly-review"
  | "task-prioritization"
  | "smart-reschedule";

export type PaletteAction =
  | "create-task"
  | "search-tasks"
  | "plan-my-day"
  | "weekly-review"
  | "task-breakdown"
  | "task-breakdown-pick"
  | "task-prioritization"
  | "smart-reschedule"
  | "open-notifications"
  | "notifications-unread"
  | "mark-all-read"
  | "cycle-theme";

export type PaletteCommand = {
  id: string;
  label: string;
  keywords?: readonly string[];
  group: CommandGroupId;
  icon: LucideIcon;
  hint?: string;
  route?: string;
  action?: PaletteAction;
  data?: { taskId: string; taskTitle: string };
};

export type RecentCommandEntry = {
  id: string;
  label: string;
  group: CommandGroupId;
  route?: string;
  action?: PaletteAction;
};

export type CommandContext = {
  navigate: (to: string) => void;
  query: string;
  openCreateTask: () => void;
  openAiDialog: (kind: AiDialogKind) => void;
  startTaskBreakdown: () => void;
  openTaskBreakdown: (taskId: string, taskTitle: string) => void;
  openNotifications: (readFilter?: "UNREAD") => void;
  markAllRead: () => void;
  cycleTheme: () => void;
};

export type FuzzyMatch = {
  score: number;
  indices: number[];
  onLabel: boolean;
};

export type CommandItemData = {
  command: PaletteCommand;
  score: number;
  indices: number[];
  onLabel: boolean;
};

export type CommandGroupView = {
  id: CommandGroupId;
  label: string;
  items: CommandItemData[];
};
