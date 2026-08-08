import { useMemo, useState } from "react";
import { BarChart3, CalendarClock, Plus, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import PlanMyDayDialog from "@/features/ai/PlanMyDayDialog";
import TaskPrioritizationDialog from "@/features/ai/TaskPrioritizationDialog";
import SmartRescheduleDialog from "@/features/ai/SmartRescheduleDialog";
import WeeklyReviewDialog from "@/features/ai/WeeklyReviewDialog";
import CreateTaskDialog from "@/features/tasks/CreateTaskDialog";
import TaskDetailsDrawer from "@/features/tasks/TaskDetailsDrawer";
import TaskSummaryBar from "@/features/tasks/TaskSummaryBar";
import TaskToolbar from "@/features/tasks/TaskToolbar";
import {
  TaskEmptyState,
  TaskErrorState,
  TaskLoadingState,
} from "@/features/tasks/TaskStates";
import TaskList from "@/features/tasks/TaskList";
import { useTaskCounts, useTasks } from "@/features/tasks/task.hooks";
import type { Task, TaskPriority, TaskStatusFilter } from "@/features/tasks/task.types";
import { Button } from "@/shared/components/ui/button";
import PageHeader from "@/shared/components/PageHeader";

function isSameDay(isoDate: string | undefined, date: Date) {
  if (!isoDate) return false;
  const target = new Date(isoDate);
  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
}

function parseStatusFilter(value: string | null): TaskStatusFilter {
  return value === "TODO" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED" ||
    value === "OVERDUE"
    ? value
    : "ALL";
}

function parsePriorityFilter(value: string | null): TaskPriority | "ALL" {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "URGENT"
    ? value
    : "ALL";
}

function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const statusFilter = parseStatusFilter(searchParams.get("status"));
  const priorityFilter = parsePriorityFilter(searchParams.get("priority"));
  const dueToday = searchParams.get("dueToday") === "1";
  const taskIdFromUrl = searchParams.get("task");

  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // AI Modal Dialog States
  const [prioritizationOpen, setPrioritizationOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Selected Task Drawer State
  const [selectedTaskLocal, setSelectedTaskLocal] = useState<Task | null>(null);

  const updateTaskFilters = useMemo(
    () =>
      (updates: Record<string, string | undefined>) =>
        setSearchParams(
          (previous) => {
            const next = new URLSearchParams(previous);
            for (const [key, value] of Object.entries(updates)) {
              if (value === undefined || value === "" || value === "ALL") {
                next.delete(key);
              } else {
                next.set(key, value);
              }
            }
            return next;
          },
          { replace: true },
        ),
    [setSearchParams],
  );

  const clearTaskFromUrl = useMemo(
    () => () =>
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.delete("task");
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedTaskLocal(null);
      if (taskIdFromUrl) clearTaskFromUrl();
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskLocal(task);
    if (taskIdFromUrl) clearTaskFromUrl();
  };

  const handleSearchChange = (value: string) => {
    updateTaskFilters({ search: value.trim() ? value : undefined });
  };

  const handleStatusChange = (value: TaskStatusFilter) => {
    updateTaskFilters({ status: value === "ALL" ? undefined : value });
  };

  const handlePriorityChange = (value: TaskPriority | "ALL") => {
    updateTaskFilters({ priority: value === "ALL" ? undefined : value });
  };

  // Query Backend Tasks
  const taskCounts = useTaskCounts();
  const tasksQuery = useTasks({
    page: 1,
    limit: 50,
    search: search || undefined,
    status:
      statusFilter !== "ALL" && statusFilter !== "OVERDUE"
        ? statusFilter
        : undefined,
    overdue: statusFilter === "OVERDUE" ? true : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    sortBy: (["createdAt", "dueDate", "priority", "title"].includes(sortBy)
      ? sortBy
      : "createdAt") as "createdAt" | "dueDate" | "priority" | "title",
    sortOrder: "desc",
  });

  const rawTasks = useMemo(() => tasksQuery.data?.items ?? [], [tasksQuery.data?.items]);

  const selectedTaskFromUrl = useMemo(() => {
    if (!taskIdFromUrl) return null;
    return tasksQuery.data?.items.find((task) => task.id === taskIdFromUrl) ?? null;
  }, [taskIdFromUrl, tasksQuery.data?.items]);

  const selectedTask = selectedTaskFromUrl ?? selectedTaskLocal;

  const filteredTasks = useMemo(() => {
    let result = [...rawTasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== "ALL" && statusFilter !== "OVERDUE") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (statusFilter === "OVERDUE") {
      const now = new Date();
      result = result.filter(
        (t) =>
          t.dueDate !== undefined &&
          new Date(t.dueDate) < now &&
          t.status !== "COMPLETED",
      );
    }

    if (dueToday) {
      const today = new Date();
      result = result.filter(
        (t) => t.status !== "COMPLETED" && isSameDay(t.dueDate, today),
      );
    }

    if (priorityFilter !== "ALL") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (sortBy === "priority") {
      const priorityWeight: Record<TaskPriority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      result.sort(
        (a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0),
      );
    } else if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return result;
  }, [rawTasks, search, statusFilter, priorityFilter, dueToday, sortBy]);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="Workspace"
        title="Tasks"
        description="Plan, prioritize, and manage your productivity workstream with AI."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeeklyReviewOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <BarChart3 className="size-3.5 text-emerald-500" />
              Weekly Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <CalendarClock className="size-3.5 text-blue-500" />
              Smart Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrioritizationOpen(true)}
              className="gap-1.5 text-xs font-semibold border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10"
            >
              <Sparkles className="size-3.5 text-purple-500 animate-pulse" />
              Prioritize Tasks
            </Button>
            <PlanMyDayDialog />
            <CreateTaskDialog
              open={createTaskOpen}
              onOpenChange={setCreateTaskOpen}
            />
          </div>
        }
      />

      {/* 2. Top Summary Bar */}
      <TaskSummaryBar
        counts={{
          total: taskCounts.total,
          todo: taskCounts.todo,
          inProgress: taskCounts.inProgress,
          completed: taskCounts.completed,
          overdue: taskCounts.overdue,
        }}
        activeStatusFilter={statusFilter}
        onStatusSelect={handleStatusChange}
        isLoading={taskCounts.isLoading}
      />

      {/* 3. Sticky Top Toolbar */}
      <TaskToolbar
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        priorityFilter={priorityFilter}
        onPriorityChange={handlePriorityChange}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 4. Task List / Grid / States */}
      {tasksQuery.isLoading ? (
        <TaskLoadingState viewMode={viewMode} />
      ) : tasksQuery.isError ? (
        <TaskErrorState
          message={tasksQuery.error.message}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : filteredTasks.length === 0 ? (
        <TaskEmptyState />
      ) : (
        <TaskList
          tasks={filteredTasks}
          viewMode={viewMode}
          onSelectTask={handleSelectTask}
        />
      )}

      {/* 5. Right-side Task Details Drawer */}
      <TaskDetailsDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={handleDrawerOpenChange}
      />

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setCreateTaskOpen(true)}
          className="size-12 rounded-full shadow-lg gap-0 p-0 flex items-center justify-center bg-primary text-primary-foreground hover:scale-105 transition-transform"
          aria-label="Create Task"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      {/* Controlled AI Dialogs */}
      <TaskPrioritizationDialog
        open={prioritizationOpen}
        onOpenChange={setPrioritizationOpen}
      />
      <SmartRescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />
      <WeeklyReviewDialog
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
      />
    </div>
  );
}

export default TasksPage;
