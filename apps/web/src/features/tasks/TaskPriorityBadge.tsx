import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { TaskPriority } from "./task.types";

const labels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  switch (priority) {
    case "URGENT":
      return (
        <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <AlertCircle className="size-3" />
          {labels[priority]}
        </Badge>
      );
    case "HIGH":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          {labels[priority]}
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
          <ArrowUp className="size-3" />
          {labels[priority]}
        </Badge>
      );
    case "LOW":
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <ArrowDown className="size-3" />
          {labels[priority]}
        </Badge>
      );
  }
}

export default TaskPriorityBadge;
