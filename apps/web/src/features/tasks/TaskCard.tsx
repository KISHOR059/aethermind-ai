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
import { formatShortTaskDueDate } from "./task.utils";

export interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const formattedDate = formatShortTaskDueDate(task.dueDate);
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
      className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer space-y-3"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            onClick={handleToggleComplete}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="size-5 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle className="size-5 hover:scale-110 transition-transform" />
            )}
          </button>

          <div className="space-y-1 min-w-0 flex-1">
            <h4
              className={`text-sm font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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

      {/* Badges and Metadata Footer */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
          {formattedDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3 text-primary" />
              {formattedDate}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10 rounded-full"
            title="Break Down with AI"
            onClick={(e) => {
              e.stopPropagation();
              setBreakdownOpen(true);
            }}
          >
            <Sparkles className="size-3.5" />
          </Button>
        </div>
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

export default TaskCard;
