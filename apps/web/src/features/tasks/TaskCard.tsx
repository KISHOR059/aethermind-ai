import { Check, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { notify } from "@/shared/lib/notifications";

import { useDeleteTask, useUpdateTask } from "./task.hooks";
import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import type { Task } from "./task.types";

function formatDueDate(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function TaskCard({ task }: { task: Task }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-2">
          <CardTitle className="truncate text-base">{task.title}</CardTitle>
          <div className="flex flex-wrap gap-2"><TaskStatusBadge status={task.status} /><TaskPriorityBadge priority={task.priority} /></div>
        </div>
        <div className="flex shrink-0 gap-1">
          {task.status !== "COMPLETED" && <Button aria-label={`Complete ${task.title}`} size="icon-sm" variant="ghost" onClick={() => updateTask.mutate({ id: task.id, input: { status: "COMPLETED" } }, { onSuccess: () => notify.success("Task completed"), onError: (error) => notify.error("Unable to complete task", error.message) })}><Check /></Button>}
          <Button aria-label={`Delete ${task.title}`} size="icon-sm" variant="ghost" onClick={() => deleteTask.mutate(task.id, { onSuccess: () => notify.success("Task deleted"), onError: (error) => notify.error("Unable to delete task", error.message) })}><Trash2 /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {task.description && <p className="line-clamp-2 text-muted-foreground">{task.description}</p>}
        {formatDueDate(task.dueDate) && <p className="text-muted-foreground">Due {formatDueDate(task.dueDate)}</p>}
      </CardContent>
    </Card>
  );
}

export default TaskCard;
