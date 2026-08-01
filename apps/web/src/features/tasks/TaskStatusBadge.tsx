import { Badge } from "@/shared/components/ui/badge";
import type { TaskStatus } from "./task.types";

const labels: Record<TaskStatus, string> = { TODO: "To do", IN_PROGRESS: "In progress", COMPLETED: "Completed", ARCHIVED: "Archived" };

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={status === "COMPLETED" ? "secondary" : status === "IN_PROGRESS" ? "default" : "outline"}>{labels[status]}</Badge>;
}

export default TaskStatusBadge;

