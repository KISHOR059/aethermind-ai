import { Circle, CircleCheckBig, LoaderCircle } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { TaskStatus } from "./task.types";

const labels: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <CircleCheckBig className="size-3 text-emerald-500" />
          {labels[status]}
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <LoaderCircle className="size-3 text-blue-500 animate-spin-slow" />
          {labels[status]}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted/80 text-muted-foreground border-border/60 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <Circle className="size-3 text-muted-foreground" />
          {labels[status]}
        </Badge>
      );
  }
}

export default TaskStatusBadge;
