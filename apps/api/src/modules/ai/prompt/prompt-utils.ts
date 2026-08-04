import { TaskStatus } from "../../tasks/task.model.js";
import type { TaskContext } from "../context/context.types.js";

export interface FormattedPromptContextOptions {
  readonly mode?: "active" | "all" | "summary";
  readonly maxTasks?: number;
}

export function formatTaskContextForPrompt(
  taskContext: TaskContext,
  options: FormattedPromptContextOptions = {},
): string {
  const { mode = "active", maxTasks = 35 } = options;

  // Precompute statistics in Node.js so LLM doesn't have to calculate math
  const statistics = {
    totalTasks: taskContext.totalTasks,
    incompleteTasks: taskContext.incompleteTasks,
    completedTasks: taskContext.completedTasks,
    overdueTasks: taskContext.overdueTasks,
    dueTodayTasks: taskContext.dueTodayTasks,
    highPriorityTasks: taskContext.highPriorityTasks,
    completedTodayTasks: taskContext.completedTodayTasks,
    estimatedTotalMinutes: taskContext.estimatedMinutes,
  };

  // Filter tasks based on mode to minimize prompt size
  let filteredTasks = taskContext.tasks;
  if (mode === "active") {
    // Only incomplete tasks and tasks completed today
    filteredTasks = taskContext.tasks.filter(
      (task) =>
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.ARCHIVED,
    );
  }

  // Cap to maxTasks to prevent prompt bloat
  const slicedTasks = filteredTasks.slice(0, maxTasks);

  // Send ONLY AI-relevant fields in compact form
  const leanTasks = slicedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : undefined,
    estMins: task.estimatedMinutes ?? undefined,
  }));

  return JSON.stringify({
    statistics,
    tasks: leanTasks,
  });
}
