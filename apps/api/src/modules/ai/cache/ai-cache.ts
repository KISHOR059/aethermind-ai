import type { TaskContext, TargetTaskDetails } from "../context/context.types.js";
import type { AIExecutionRequest, AIExecutionResult } from "../pipeline/pipeline.types.js";

type CacheEntry<T> = {
  readonly result: AIExecutionResult<T>;
  readonly expiresAt: number;
};

export class AICacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number = 200;

  public getCacheKey(
    request: AIExecutionRequest,
    context: {
      tasks?: TaskContext;
      targetTask?: TargetTaskDetails;
    },
  ): string {
    const promptId = request.prompt;
    const userId = request.userId;
    const taskId = request.taskId ?? "";
    const message = request.userMessage ?? "";

    const taskStats = context.tasks;
    const taskHash = taskStats
      ? `${taskStats.totalTasks}:${taskStats.incompleteTasks}:${taskStats.overdueTasks}:${taskStats.estimatedMinutes}`
      : context.targetTask
        ? `${context.targetTask.id}:${context.targetTask.status}:${context.targetTask.priority}`
        : "no-tasks";

    return `${userId}:${promptId}:${taskId}:${taskHash}:${message}`;
  }

  public get<T>(key: string): AIExecutionResult<T> | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.result as AIExecutionResult<T>;
  }

  public set<T>(key: string, result: AIExecutionResult<T>, ttlMs = 300_000): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const aiCacheService = new AICacheService();
