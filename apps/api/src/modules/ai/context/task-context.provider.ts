import type { ITaskRepository } from "../../tasks/task.repository.interface.js";
import {
  TaskPriority,
  TaskStatus,
} from "../../tasks/task.model.js";
import type { TaskContext, TaskSummary } from "./context.types.js";
import type { ContextProvider } from "./context-provider.interface.js";

const TASK_CONTEXT_LIMIT = 1_000;

export class TaskContextProvider implements ContextProvider<TaskContext> {
  public constructor(private readonly taskRepository: ITaskRepository) {}

  public async build(userId: string): Promise<TaskContext> {
    const result = await this.taskRepository.findMany(userId, {
      pagination: {
        page: 1,
        limit: TASK_CONTEXT_LIMIT,
        skip: 0,
      },
      sort: {
        field: "createdAt",
        direction: "desc",
      },
      filters: {},
    });

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tasks = result.items.map(toTaskSummary);
    const incompleteTasks = tasks.filter(
      (task) =>
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.ARCHIVED,
    );
    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    ).length;
    const overdueTasks = incompleteTasks.filter(
      (task) =>
        task.dueDate !== undefined &&
        task.dueDate.toISOString().slice(0, 10) < today,
    ).length;
    const dueTodayTasks = incompleteTasks.filter(
      (task) => task.dueDate?.toISOString().slice(0, 10) === today,
    ).length;
    const highPriorityTasks = incompleteTasks.filter(
      (task) =>
        task.priority === TaskPriority.HIGH ||
        task.priority === TaskPriority.URGENT,
    ).length;
    const completedTodayTasks = tasks.filter(
      (task) =>
        task.status === TaskStatus.COMPLETED &&
        task.completedAt?.toISOString().slice(0, 10) === today,
    ).length;

    return {
      totalTasks: result.total,
      incompleteTasks: incompleteTasks.length,
      completedTasks,
      overdueTasks,
      dueTodayTasks,
      highPriorityTasks,
      completedTodayTasks,
      estimatedMinutes: incompleteTasks.reduce(
        (total, task) => total + (task.estimatedMinutes ?? 0),
        0,
      ),
      tasks,
    };
  }
}

function toTaskSummary(task: {
  _id: { toString(): string };
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedMinutes?: number;
  completedAt?: Date;
}): TaskSummary {
  return {
    id: task._id.toString(),
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedMinutes: task.estimatedMinutes,
    completedAt: task.completedAt,
  };
}
