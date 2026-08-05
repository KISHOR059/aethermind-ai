import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  Flag,
  Sparkles,
  Split,
  Trash2,
  Zap,
} from "lucide-react";

import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import type { Task, TaskPriority, TaskStatus } from "./task.types";
import { useDeleteTask, useUpdateTask } from "./task.hooks";
import TaskBreakdownDialog from "@/features/ai/TaskBreakdownDialog";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { notify } from "@/shared/lib/notifications";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

export interface TaskDetailsDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsDrawer({
  task,
  open,
  onOpenChange,
}: TaskDetailsDrawerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (!task) return null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask.mutate(
      { id: task.id, input: { status: newStatus } },
      {
        onSuccess: () => notify.success(`Task status updated to ${newStatus}`),
        onError: (err) => notify.error("Failed to update status", err.message),
      },
    );
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    updateTask.mutate(
      { id: task.id, input: { priority: newPriority } },
      {
        onSuccess: () => notify.success(`Priority set to ${newPriority}`),
        onError: (err) => notify.error("Failed to update priority", err.message),
      },
    );
  };

  const handleTitleSubmit = () => {
    if (titleText.trim() && titleText !== task.title) {
      updateTask.mutate(
        { id: task.id, input: { title: titleText.trim() } },
        {
          onSuccess: () => {
            notify.success("Title updated");
            setIsEditingTitle(false);
          },
        },
      );
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleAISummarize = () => {
    notify.info(
      "AI Task Summary",
      `Task "${task.title}" is currently ${task.status.toLowerCase()} with ${task.priority.toLowerCase()} priority.`,
    );
  };

  const formattedDueDate = task.dueDate
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(task.dueDate))
    : "No due date set";

  const formattedCreatedDate = task.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(task.createdAt))
    : "N/A";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md lg:max-w-lg p-0 flex flex-col justify-between h-full bg-card">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="flex items-center gap-1 mr-6">
              <Button
                variant="ghost"
                size="icon-sm"
                title="Copy Task ID"
                onClick={() => {
                  navigator.clipboard.writeText(task.id);
                  notify.success("Task ID copied");
                }}
              >
                <Copy className="size-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hover:text-rose-600 hover:bg-rose-500/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Title Editor */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="text-base font-bold h-10"
              />
              <Button size="sm" onClick={handleTitleSubmit}>
                Save
              </Button>
            </div>
          ) : (
            <div className="group flex items-start justify-between gap-2">
              <SheetTitle className="text-xl font-extrabold tracking-tight text-foreground leading-snug">
                {task.title}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setTitleText(task.title);
                  setIsEditingTitle(true);
                }}
              >
                <Edit3 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Selectors Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border/60 bg-muted/20">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="mt-1 w-full text-xs font-semibold bg-background border rounded-lg p-1.5 focus:ring-1 focus:ring-primary"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flag className="size-3 text-amber-500" />
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="mt-1 w-full text-xs font-semibold bg-background border rounded-lg p-1.5 focus:ring-1 focus:ring-primary"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* AI Quick Actions Bar */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              AI Assistant Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBreakdownOpen(true)}
                className="gap-1.5 text-xs justify-start border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
              >
                <Split className="size-3.5" />
                AI Breakdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISummarize}
                className="gap-1.5 text-xs justify-start border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <Zap className="size-3.5" />
                AI Summary
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description
            </h4>
            <p className="text-xs text-foreground leading-relaxed p-3 rounded-xl border border-border/60 bg-card">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Metadata Section */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                Due Date
              </span>
              <span className="font-semibold text-foreground">{formattedDueDate}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-amber-500" />
                Created At
              </span>
              <span className="font-medium">{formattedCreatedDate}</span>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete task?"
          description={`Are you sure you want to remove "${task.title}"?`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteTask.mutate(task.id, {
              onSuccess: () => {
                notify.success("Task deleted");
                onOpenChange(false);
              },
            });
          }}
        />

        {breakdownOpen && (
          <TaskBreakdownDialog
            taskId={task.id}
            taskTitle={task.title}
            open={breakdownOpen}
            onOpenChange={setBreakdownOpen}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TaskDetailsDrawer;
