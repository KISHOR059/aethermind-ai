import type { AIPipeline } from "./pipeline/ai-pipeline.js";
import type { AIExecutionResult } from "./pipeline/pipeline.types.js";
import type {
  DailyPlannerResponse,
  TaskBreakdownResponse,
} from "./parser/schemas/index.js";
import type { AIProvider } from "./providers/ai-provider.interface.js";
import type { ProviderStatus } from "./providers/types.js";
import { TaskRepository } from "../tasks/task.repository.js";
import type { ITaskRepository } from "../tasks/task.repository.interface.js";
import { NotFoundError } from "../../utils/app-error.js";

export type AiHealth = {
  provider: string;
  model: string;
  status: ProviderStatus;
  version: string;
};

export class AiService {
  private readonly taskRepository: ITaskRepository;

  public constructor(
    private readonly aiPipeline: AIPipeline,
    private readonly aiProvider: AIProvider,
    taskRepository?: ITaskRepository,
  ) {
    this.taskRepository = taskRepository ?? new TaskRepository();
  }

  public getHealth(): AiHealth {
    return {
      provider: this.aiProvider.modelInformation.provider,
      model: this.aiProvider.modelInformation.model,
      status: this.aiProvider.status,
      version: this.aiProvider.modelInformation.version,
    };
  }

  public planDay(
    userId: string,
  ): Promise<AIExecutionResult<DailyPlannerResponse>> {
    return this.aiPipeline.execute({
      prompt: "daily-planner",
      userId,
    });
  }

  public async breakDownTask(
    taskId: string,
    userId: string,
  ): Promise<AIExecutionResult<TaskBreakdownResponse>> {
    const task = await this.taskRepository.findById(userId, taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return this.aiPipeline.execute({
      prompt: "task-breakdown",
      userId,
      taskId,
    });
  }
}

