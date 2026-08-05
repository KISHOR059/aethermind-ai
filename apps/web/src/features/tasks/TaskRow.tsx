import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Sparkles,
  Split,
  Trash2,
} from "lucide-react";

import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import type { Task } from "./task.types";
import { useDeleteTask, useUpdateTask } from "./task.hooks";
import TaskBreakdownDialog from "@/features/ai/TaskBreakdownDialog";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { notify } from "@/shared/lib/notifications";

function formatDueDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export interface TaskRowProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

export function TaskRow({ task, onSelect }: TaskRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const formattedDate = formatDueDate(task.dueDate);
  const isCompleted = task.status === "COMPLETED";

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = isCompleted ? "TODO" : "COMPLETED";
    updateTask.mutate(
      { id: task.id, input: { status: nextStatus } },
      {
        onSuccess: () =>
          notify.success(
            nextStatus === "COMPLETED" ? "Task completed" : "Task marked as todo",
          ),
        onError: (error) => notify.error("Unable to update status", error.message),
      },
    );
  };

  return (
    <div
      onClick={() => onSelect?.(task)}
      className="group relative flex items-center justify-between rounded-xl border border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 shadow-2xs hover:shadow-sm hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer gap-4"
    >
      {/* Left: Checkbox & Title/Desc */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={handleToggleComplete}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="size-5 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <Circle className="size-5 hover:scale-110 transition-transform" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors ${
              isCompleted ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Badges & Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>

        {formattedDate && (
          <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <CalendarDays className="size-3.5 text-primary" />
            {formattedDate}
          </span>
        )}

        {/* AI Action Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10 rounded-full"
          title="Break Down with AI"
          onClick={(e) => {
            e.stopPropagation();
            setBreakdownOpen(true);
          }}
        >
          <Sparkles className="size-3.5" />
        </Button>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setBreakdownOpen(true);
              }}
            >
              <Split className="mr-2 size-3.5" /> Break Down with AI
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="mr-2 size-3.5" /> Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task?"
        description={`This will remove “${task.title}” from your workspace.`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteTask.mutate(task.id, {
            onSuccess: () => notify.success("Task deleted"),
            onError: (error) => notify.error("Unable to delete task", error.message),
          })
        }
      />

      {breakdownOpen && (
        <TaskBreakdownDialog
          taskId={task.id}
          taskTitle={task.title}
          open={breakdownOpen}
          onOpenChange={setBreakdownOpen}
        />
      )}
    </div>
  );
}

export default TaskRow;
