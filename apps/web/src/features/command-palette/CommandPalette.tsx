import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  clearRecentCommands,
  clearRecentSearches,
  loadRecentCommands,
  loadRecentSearches,
  saveRecentCommand,
  saveRecentSearch,
  shouldPersistRecent,
  toRecentEntry,
} from "./command-palette.service";
import { CommandPaletteContext } from "./command-palette.hooks";
import type { CommandPaletteContextValue } from "./command-palette.hooks";
import type { AiDialogKind, PaletteCommand } from "./command-palette.types";

const CommandPaletteDialog = lazy(() =>
  import("./CommandPaletteDialog").then((module) => ({
    default: module.CommandPaletteDialog,
  })),
);

const CreateTaskDialog = lazy(() =>
  import("@/features/tasks/CreateTaskDialog").then((module) => ({
    default: module.CreateTaskDialog,
  })),
);

const PlanMyDayDialog = lazy(() =>
  import("@/features/ai/PlanMyDayDialog").then((module) => ({
    default: module.PlanMyDayDialog,
  })),
);

const WeeklyReviewDialog = lazy(() =>
  import("@/features/ai/WeeklyReviewDialog").then((module) => ({
    default: module.WeeklyReviewDialog,
  })),
);

const SmartRescheduleDialog = lazy(() =>
  import("@/features/ai/SmartRescheduleDialog").then((module) => ({
    default: module.SmartRescheduleDialog,
  })),
);

const TaskPrioritizationDialog = lazy(() =>
  import("@/features/ai/TaskPrioritizationDialog").then((module) => ({
    default: module.TaskPrioritizationDialog,
  })),
);

const TaskBreakdownDialog = lazy(() =>
  import("@/features/ai/TaskBreakdownDialog").then((module) => ({
    default: module.TaskBreakdownDialog,
  })),
);

export type CommandPaletteProviderProps = {
  children: ReactNode;
};

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [recentCommands, setRecentCommands] = useState(() => loadRecentCommands());
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [aiDialog, setAiDialog] = useState<AiDialogKind | null>(null);
  const [breakdownTarget, setBreakdownTarget] = useState<{
    taskId: string;
    taskTitle: string;
  } | null>(null);

  const open = useCallback(() => {
    setHasOpened(true);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setHasOpened(true);
    setIsOpen((previous) => !previous);
  }, []);

  const registerRecentCommand = useCallback((command: PaletteCommand) => {
    if (!shouldPersistRecent(command)) return;
    setRecentCommands(saveRecentCommand(toRecentEntry(command)));
  }, []);

  const registerRecentSearch = useCallback((search: string) => {
    setRecentSearches(saveRecentSearch(search));
  }, []);

  const handleClearRecentCommands = useCallback(() => {
    clearRecentCommands();
    setRecentCommands([]);
  }, []);

  const handleClearRecentSearches = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const openCreateTask = useCallback(() => setCreateTaskOpen(true), []);
  const openAiDialog = useCallback((kind: AiDialogKind) => setAiDialog(kind), []);
  const openTaskBreakdown = useCallback((taskId: string, taskTitle: string) => {
    setBreakdownTarget({ taskId, taskTitle });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((previous) => !previous);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      recentCommands,
      recentSearches,
      registerRecentCommand,
      registerRecentSearch,
      clearRecentCommands: handleClearRecentCommands,
      clearRecentSearches: handleClearRecentSearches,
      openCreateTask,
      openAiDialog,
      openTaskBreakdown,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      recentCommands,
      recentSearches,
      registerRecentCommand,
      registerRecentSearch,
      handleClearRecentCommands,
      handleClearRecentSearches,
      openCreateTask,
      openAiDialog,
      openTaskBreakdown,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        {hasOpened && <CommandPaletteDialog open={isOpen} onOpenChange={setIsOpen} />}
        {createTaskOpen && (
          <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
        )}
        {aiDialog === "plan-my-day" && (
          <PlanMyDayDialog open onOpenChange={(next) => !next && setAiDialog(null)} />
        )}
        {aiDialog === "weekly-review" && (
          <WeeklyReviewDialog open onOpenChange={(next) => !next && setAiDialog(null)} />
        )}
        {aiDialog === "smart-reschedule" && (
          <SmartRescheduleDialog open onOpenChange={(next) => !next && setAiDialog(null)} />
        )}
        {aiDialog === "task-prioritization" && (
          <TaskPrioritizationDialog open onOpenChange={(next) => !next && setAiDialog(null)} />
        )}
        {breakdownTarget && (
          <TaskBreakdownDialog
            taskId={breakdownTarget.taskId}
            taskTitle={breakdownTarget.taskTitle}
            open
            onOpenChange={(next) => !next && setBreakdownTarget(null)}
          />
        )}
      </Suspense>
    </CommandPaletteContext.Provider>
  );
}

export default CommandPaletteProvider;
