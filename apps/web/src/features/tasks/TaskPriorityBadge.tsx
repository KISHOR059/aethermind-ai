import { Flag } from "lucide-react";
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
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <Flag className="size-3 text-rose-500 fill-rose-500" />
          {labels[priority]}
        </Badge>
      );
    case "HIGH":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <Flag className="size-3 text-red-500 fill-red-500" />
          {labels[priority]}
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <Flag className="size-3 text-amber-500 fill-amber-500" />
          {labels[priority]}
        </Badge>
      );
    case "LOW":
    default:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px] font-semibold py-0.5 px-2 rounded-full">
          <Flag className="size-3 text-blue-500" />
          {labels[priority]}
        </Badge>
      );
  }
}

export default TaskPriorityBadge;
