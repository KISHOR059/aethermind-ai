import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Palette, Search } from "lucide-react";

import { useTheme } from "@/app/ThemeProvider";
import { useMarkAllAsRead } from "@/features/notifications";
import { openNotificationsDrawer } from "@/features/notifications/notifications-events";
import { notify } from "@/shared/lib/notifications";

import {
  AI_COMMANDS,
  CALENDAR_COMMANDS,
  GROUP_LABELS,
  NAVIGATION_COMMANDS,
  NOTIFICATION_COMMANDS,
  PICKER_RESULTS_LIMIT,
  SETTINGS_COMMANDS,
  STATIC_COMMAND_GROUPS,
  TASK_COMMANDS,
} from "./command-palette.constants";
import {
  useCommandPalette,
  usePaletteEventIndex,
  usePaletteNotificationIndex,
  usePaletteTaskIndex,
} from "./command-palette.hooks";
import {
  buildCalendarCommands,
  buildEventCommands,
  buildNotificationCommands,
  buildTaskBreakdownCommands,
  buildTaskCommands,
  groupFilteredCommands,
  iconForGroup,
  resolveExecutor,
} from "./command-palette.service";
import type {
  CommandContext,
  CommandGroupView,
  CommandItemData,
  PaletteCommand,
} from "./command-palette.types";
import { CommandFooter } from "./CommandFooter";
import { CommandInput } from "./CommandInput";
import { CommandList } from "./CommandList";

export type CommandPaletteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PaletteMode = "default" | "task-pick";

const MOTION_OVERLAY = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

const MOTION_CONTENT = {
  initial: { opacity: 0, scale: 0.96, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -10 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

export function CommandPaletteDialog({ open, onOpenChange }: CommandPaletteDialogProps) {
  const {
    close,
    recentCommands,
    recentSearches,
    registerRecentCommand,
    registerRecentSearch,
    openCreateTask,
    openAiDialog,
    openTaskBreakdown,
  } = useCommandPalette();

  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const markAllRead = useMarkAllAsRead();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<PaletteMode>("default");

  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setQuery("");
      setMode("default");
      setActiveIndex(0);
    }
  }

  const taskIndex = usePaletteTaskIndex(open);
  const eventIndex = usePaletteEventIndex(open);
  const notificationIndex = usePaletteNotificationIndex(open);

  const commandContext = useMemo<CommandContext>(
    () => ({
      navigate: (to) => navigate(to),
      query,
      openCreateTask,
      openAiDialog,
      startTaskBreakdown: () => {
        setMode("task-pick");
        setActiveIndex(0);
      },
      openTaskBreakdown,
      openNotifications: (readFilter) => openNotificationsDrawer(readFilter),
      markAllRead: () =>
        markAllRead.mutate(undefined, {
          onSuccess: () => notify.success("All notifications marked as read"),
        }),
      cycleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    }),
    [navigate, query, openCreateTask, openAiDialog, openTaskBreakdown, markAllRead, resolvedTheme, setTheme],
  );

  const staticCommands = useMemo<PaletteCommand[]>(() => {
    const themeTemplate = SETTINGS_COMMANDS.find((command) => command.id === "settings-theme");
    const themeCommand: PaletteCommand = {
      id: "settings-theme",
      label: "Theme",
      group: "settings",
      icon: themeTemplate?.icon ?? Palette,
      action: "cycle-theme",
      hint: resolvedTheme === "dark" ? "Dark" : "Light",
      keywords: themeTemplate?.keywords,
    };
    return [
      ...NAVIGATION_COMMANDS,
      ...TASK_COMMANDS,
      ...CALENDAR_COMMANDS,
      ...buildCalendarCommands(),
      ...AI_COMMANDS,
      ...NOTIFICATION_COMMANDS,
      ...SETTINGS_COMMANDS.map((command) =>
        command.id === "settings-theme" ? themeCommand : command,
      ),
    ];
  }, [resolvedTheme]);

  const taskCommands = useMemo(
    () => buildTaskCommands(taskIndex.data?.items ?? []),
    [taskIndex.data],
  );
  const breakdownCommands = useMemo(
    () => buildTaskBreakdownCommands(taskIndex.data?.items ?? []),
    [taskIndex.data],
  );
  const eventCommands = useMemo(
    () => buildEventCommands(eventIndex.data?.events ?? []),
    [eventIndex.data],
  );
  const notificationCommands = useMemo(
    () => buildNotificationCommands(notificationIndex.data?.items ?? []),
    [notificationIndex.data],
  );

  const defaultGroups = useMemo<CommandGroupView[]>(() => {
    const groups: CommandGroupView[] = [];

    if (recentSearches.length > 0) {
      groups.push({
        id: "recent-searches",
        label: GROUP_LABELS["recent-searches"],
        items: recentSearches.map((search, index) => ({
          command: {
            id: `recent-search:${index}:${search}`,
            label: search,
            group: "recent-searches",
            icon: Search,
          },
          score: 0,
          indices: [],
          onLabel: false,
        })),
      });
    }

    if (recentCommands.length > 0) {
      groups.push({
        id: "recent",
        label: GROUP_LABELS.recent,
        items: recentCommands.map((entry) => ({
          command: {
            id: entry.id,
            label: entry.label,
            group: entry.group,
            icon: iconForGroup(entry.group),
            route: entry.route,
            action: entry.action,
          },
          score: 0,
          indices: [],
          onLabel: false,
        })),
      });
    }

    for (const groupId of STATIC_COMMAND_GROUPS) {
      const commands = staticCommands.filter((command) => command.group === groupId);
      if (commands.length > 0) {
        groups.push({
          id: groupId,
          label: GROUP_LABELS[groupId],
          items: commands.map((command) => ({
            command,
            score: 0,
            indices: [],
            onLabel: false,
          })),
        });
      }
    }

    return groups;
  }, [recentSearches, recentCommands, staticCommands]);

  const pickerGroups = useMemo<CommandGroupView[]>(() => {
    const items: CommandItemData[] = query.trim()
      ? (groupFilteredCommands(breakdownCommands, query, PICKER_RESULTS_LIMIT)[0]?.items ?? [])
      : breakdownCommands
          .slice(0, PICKER_RESULTS_LIMIT)
          .map((command) => ({ command, score: 0, indices: [], onLabel: false }));
    return [{ id: "tasks", label: GROUP_LABELS.tasks, items }];
  }, [breakdownCommands, query]);

  const searchGroups = useMemo<CommandGroupView[]>(() => {
    if (mode === "task-pick") return pickerGroups;
    if (!query.trim()) return defaultGroups;
    return groupFilteredCommands([
      ...staticCommands,
      ...taskCommands,
      ...eventCommands,
      ...notificationCommands,
    ], query);
  }, [mode, query, pickerGroups, defaultGroups, staticCommands, taskCommands, eventCommands, notificationCommands]);

  const flatItems = useMemo<CommandItemData[]>(
    () => searchGroups.flatMap((group) => group.items),
    [searchGroups],
  );

  const registerRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) itemRefs.current.set(id, element);
    else itemRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const active = flatItems[activeIndex];
    if (!active) return;
    itemRefs.current.get(active.command.id)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatItems]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(0);
  }, []);

  const handleExecute = useCallback(
    (item: CommandItemData) => {
      if (item.command.group === "recent-searches") {
        setQuery(item.command.label);
        return;
      }
      registerRecentCommand(item.command);
      registerRecentSearch(query);
      close();
      resolveExecutor(item.command)(commandContext);
    },
    [commandContext, close, query, registerRecentCommand, registerRecentSearch],
  );

  const handleListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        if (mode === "task-pick") {
          event.preventDefault();
          setMode("default");
          setActiveIndex(0);
        }
        return;
      }
      if (flatItems.length === 0) return;
      switch (event.key) {
        case "ArrowDown":
        case "Tab":
          event.preventDefault();
          setActiveIndex((current) => (current + 1) % flatItems.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((current) => (current - 1 + flatItems.length) % flatItems.length);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(flatItems.length - 1);
          break;
        case "Enter": {
          const item = flatItems[activeIndex];
          if (item) {
            event.preventDefault();
            handleExecute(item);
          }
          break;
        }
      }
    },
    [flatItems, activeIndex, handleExecute, mode],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) registerRecentSearch(query);
      onOpenChange(next);
    },
    [onOpenChange, query, registerRecentSearch],
  );

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] dark:bg-black/50"
                {...MOTION_OVERLAY}
              />
            </DialogPrimitive.Overlay>
          )}
          {open && (
            <DialogPrimitive.Content
              forceMount
              asChild
              onEscapeKeyDown={(event) => {
                if (mode === "task-pick") {
                  event.preventDefault();
                  setMode("default");
                  setActiveIndex(0);
                }
              }}
            >
              <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[10vh] sm:p-4 sm:pt-[14vh] pointer-events-none">
                <motion.div
                  aria-label="Command palette"
                  className="pointer-events-auto flex max-h-[min(80vh,560px)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-popover/95 text-popover-foreground shadow-2xl shadow-black/20 ring-1 ring-border/50 backdrop-blur-md dark:shadow-black/60"
                  {...MOTION_CONTENT}
                  onKeyDown={handleListKeyDown}
                >
                  <CommandInput
                    query={query}
                    onQueryChange={handleQueryChange}
                    placeholder={
                      mode === "task-pick"
                        ? "Select a task to break down…"
                        : "Type a command or search…"
                    }
                  />
                  <CommandList
                    groups={searchGroups}
                    query={query}
                    activeId={flatItems[activeIndex]?.command.id}
                    onSelect={handleExecute}
                    onActiveChange={(_item, index) => setActiveIndex(index)}
                    registerRef={registerRef}
                    onKeyDown={handleListKeyDown}
                  />
                  <CommandFooter
                    isMac={isMac}
                    activeLabel={flatItems[activeIndex]?.command.label}
                  />
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
