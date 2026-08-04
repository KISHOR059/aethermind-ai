import { Check, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { notify } from "@/shared/lib/notifications";

import { useDeleteTask, useUpdateTask } from "./task.hooks";
import ConfirmDialog from "@/shared/components/ConfirmDialog";
import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import type { Task } from "./task.types";
import { TaskBreakdownDialog } from "@/features/ai/TaskBreakdownDialog";

function formatDueDate(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function TaskCard({ task }: { task: Task }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
          <div className="min-w-0 space-y-2">
            <CardTitle className="truncate text-base">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {task.status !== "COMPLETED" && (
              <Button
                aria-label={`Complete ${task.title}`}
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  updateTask.mutate(
                    { id: task.id, input: { status: "COMPLETED" } },
                    {
                      onSuccess: () => notify.success("Task completed"),
                      onError: (error) =>
                        notify.error("Unable to complete task", error.message),
                    },
                  )
                }
              >
                <Check />
              </Button>
            )}
            <Button
              aria-label={`Delete ${task.title}`}
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {task.description && (
            <p className="line-clamp-2 text-muted-foreground">{task.description}</p>
          )}
          {formatDueDate(task.dueDate) && (
            <p className="text-muted-foreground">Due {formatDueDate(task.dueDate)}</p>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          onClick={() => setBreakdownOpen(true)}
        >
          <Sparkles className="size-3.5 text-primary animate-pulse" />
          Break Down with AI
        </Button>
      </CardFooter>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task?"
        description={`This will remove “${task.title}” from your task list.`}
        confirmLabel="Delete"
        onConfirm={() =>
          deleteTask.mutate(task.id, {
            onSuccess: () => notify.success("Task deleted"),
            onError: (error) =>
              notify.error("Unable to delete task", error.message),
          })
        }
      />

      <TaskBreakdownDialog
        taskId={task.id}
        taskTitle={task.title}
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
      />
    </Card>
  );
}

export default TaskCard;
