import { NotFoundError } from "../../utils/app-error.js";
import {
  eventBus,
  TASK_RESCHEDULE_REASON,
  TaskCompletedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskUpdatedEvent,
  type TaskEventData,
} from "../../shared/events/index.js";
import type { PublicUser } from "../auth/auth.types.js";
import { TaskStatus, type TaskDocument, type TaskPriority } from "./task.model.js";
import type {
  CreateTaskData,
  ITaskRepository,
  TaskListQuery,
  UpdateTaskData,
} from "./task.repository.interface.js";
import type {
  CreateTaskInput,
  TaskListQueryInput,
  TaskRescheduleInput,
  UpdateTaskInput,
} from "./task.validation.js";

export type PublicTask = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedMinutes?: number;
  completedAt?: Date;
  tags: string[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicTask(task: TaskDocument): PublicTask {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    startDate: task.startDate,
    estimatedMinutes: task.estimatedMinutes,
    completedAt: task.completedAt,
    tags: task.tags,
    owner: task.owner.toString(),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function toTaskEventData(task: PublicTask): TaskEventData {
  return {
    taskId: task.id,
    ownerId: task.owner,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedMinutes: task.estimatedMinutes ?? null,
  };
}

export class TaskService {
  public constructor(private readonly taskRepository: ITaskRepository) {}

  public async create(owner: PublicUser, input: CreateTaskInput): Promise<PublicTask> {
    const task = await this.taskRepository.create(owner.id, input as CreateTaskData);

    const publicTask = toPublicTask(task);

    eventBus.publish(new TaskCreatedEvent(toTaskEventData(publicTask)));

    return publicTask;
  }

  public async list(owner: PublicUser, query: TaskListQueryInput) {
    const result = await this.taskRepository.findMany(owner.id, query as TaskListQuery);

    return {
      items: result.items.map(toPublicTask),
      total: result.total,
      pagination: query.pagination,
    };
  }

  public async getById(owner: PublicUser, taskId: string): Promise<PublicTask> {
    const task = await this.taskRepository.findById(owner.id, taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return toPublicTask(task);
  }

  public async update(
    owner: PublicUser,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<PublicTask> {
    const currentTask = await this.taskRepository.findById(owner.id, taskId);

    if (!currentTask) {
      throw new NotFoundError("Task not found");
    }

    const updateData: UpdateTaskData = { ...input };

    if (input.status === TaskStatus.COMPLETED && currentTask.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (input.status && input.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = undefined;
    }

    const task = await this.taskRepository.update(owner.id, taskId, updateData);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const publicTask = toPublicTask(task);
    const eventData = toTaskEventData(publicTask);

    eventBus.publish(new TaskUpdatedEvent(eventData, Object.keys(input)));

    if (input.status === TaskStatus.COMPLETED && currentTask.status !== TaskStatus.COMPLETED) {
      eventBus.publish(new TaskCompletedEvent(eventData));
    }

    return publicTask;
  }

  public async remove(owner: PublicUser, taskId: string): Promise<void> {
    const deleted = await this.taskRepository.softDelete(owner.id, taskId);

    if (!deleted) {
      throw new NotFoundError("Task not found");
    }

    eventBus.publish(new TaskDeletedEvent({ taskId, ownerId: owner.id }));
  }

  /**
   * Reschedules a task from the calendar drag-and-drop flow.
   *
   * Only scheduling fields are mutated (`dueDate`, optional `estimatedMinutes`);
   * every other field is left untouched so the Task stays the single source of
   * truth for its own data. The emitted `task.updated` event carries the
   * `reschedule` reason so listeners can react specifically to drag-based moves.
   */
  public async reschedule(
    owner: PublicUser,
    input: TaskRescheduleInput,
  ): Promise<PublicTask> {
    const currentTask = await this.taskRepository.findById(owner.id, input.taskId);

    if (!currentTask) {
      throw new NotFoundError("Task not found");
    }

    const updateData: UpdateTaskData = { dueDate: input.dueDate };

    if (input.estimatedMinutes === null) {
      updateData.estimatedMinutes = null;
      updateData.startDate = undefined;
    } else if (input.estimatedMinutes !== undefined) {
      updateData.estimatedMinutes = input.estimatedMinutes;
      updateData.startDate = input.dueDate;
    }

    const task = await this.taskRepository.update(owner.id, input.taskId, updateData);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const publicTask = toPublicTask(task);

    eventBus.publish(
      new TaskUpdatedEvent(
        toTaskEventData(publicTask),
        Object.keys(updateData),
        TASK_RESCHEDULE_REASON,
      ),
    );

    return publicTask;
  }
}
