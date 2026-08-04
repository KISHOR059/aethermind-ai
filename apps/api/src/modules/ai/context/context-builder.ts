import type { ContextProvider } from "./context-provider.interface.js";
import {
  createContextProviderRegistry,
  type ContextProviderRegistry,
} from "./context-registry.js";
import type {
  DailyPlannerContext,
  TaskBreakdownContext,
} from "./context.types.js";
import { TaskRepository } from "../../tasks/task.repository.js";
import type { ITaskRepository } from "../../tasks/task.repository.interface.js";
import { NotFoundError } from "../../../utils/app-error.js";

export class ContextBuilder {
  private readonly taskRepository: ITaskRepository;

  public constructor(
    private readonly registry: ContextProviderRegistry =
      createContextProviderRegistry(),
    taskRepository?: ITaskRepository,
  ) {
    this.taskRepository = taskRepository ?? new TaskRepository();
  }

  public async buildDailyPlannerContext(
    userId: string,
  ): Promise<DailyPlannerContext> {
    const providers = Object.entries(this.registry) as [
      keyof ContextProviderRegistry,
      ContextProvider<unknown>,
    ][];

    const entries = await Promise.all(
      providers.map(async ([key, provider]) => [
        key,
        await provider.build(userId),
      ] as const),
    );

    return Object.fromEntries(entries) as DailyPlannerContext;
  }

  public async buildTaskBreakdownContext(
    userId: string,
    taskId: string,
  ): Promise<TaskBreakdownContext> {
    const [baseContext, targetTask] = await Promise.all([
      this.buildDailyPlannerContext(userId),
      this.taskRepository.findById(userId, taskId),
    ]);

    if (!targetTask) {
      throw new NotFoundError("Task not found");
    }

    const existingSubtasks = baseContext.tasks.tasks
      .filter((t) => t.title.startsWith(`[${targetTask.title}]`))
      .map((t) => t.title);

    return {
      targetTask: {
        id: targetTask._id.toString(),
        title: targetTask.title,
        description: targetTask.description,
        priority: targetTask.priority,
        status: targetTask.status,
        dueDate: targetTask.dueDate,
        estimatedMinutes: targetTask.estimatedMinutes,
        existingSubtasks,
      },
      user: baseContext.user,
      settings: baseContext.settings,
      time: baseContext.time,
      system: baseContext.system,
    };
  }
}

const defaultContextBuilder = new ContextBuilder();

export const buildDailyPlannerContext = (
  userId: string,
): Promise<DailyPlannerContext> =>
  defaultContextBuilder.buildDailyPlannerContext(userId);

export const buildTaskBreakdownContext = (
  userId: string,
  taskId: string,
): Promise<TaskBreakdownContext> =>
  defaultContextBuilder.buildTaskBreakdownContext(userId, taskId);

