import { NotFoundError } from "../../utils/app-error.js";
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

export class TaskService {
  public constructor(private readonly taskRepository: ITaskRepository) {}

  public async create(owner: PublicUser, input: CreateTaskInput): Promise<PublicTask> {
    const task = await this.taskRepository.create(owner.id, input as CreateTaskData);

    return toPublicTask(task);
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

    return toPublicTask(task);
  }

  public async remove(owner: PublicUser, taskId: string): Promise<void> {
    const deleted = await this.taskRepository.softDelete(owner.id, taskId);

    if (!deleted) {
      throw new NotFoundError("Task not found");
    }
  }
}
