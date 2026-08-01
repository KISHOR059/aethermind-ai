import { Badge } from "@/shared/components/ui/badge";
import type { TaskPriority } from "./task.types";

const labels: Record<TaskPriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={priority === "URGENT" ? "destructive" : priority === "HIGH" ? "default" : "outline"}>{labels[priority]}</Badge>;
}

export default TaskPriorityBadge;

