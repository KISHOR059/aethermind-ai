import { CheckCircle2, Clock, ListTodo } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { TaskStatus } from "./task.types";

const labels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 hover:bg-emerald-500/20">
          <CheckCircle2 className="size-3" />
          {labels[status]}
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="default" className="gap-1">
          <Clock className="size-3" />
          {labels[status]}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <ListTodo className="size-3" />
          {labels[status]}
        </Badge>
      );
  }
}

export default TaskStatusBadge;
