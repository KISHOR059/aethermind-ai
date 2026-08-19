import { ApiError, GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";
import { logger } from "../../../lib/logger.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
} from "../../../utils/app-error.js";
import type { AIProvider } from "./ai-provider.interface.js";
import type {
  FinishReason,
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderHealth,
  ProviderStatus,
  ThinkingLevel,
  UsageMetadata,
} from "./types.js";

export class GeminiProvider implements AIProvider {
  public readonly modelInformation: ModelInformation;
  public status: ProviderStatus;

  private readonly client: GoogleGenAI | null;
  private readonly configuredModel: string;
  private readonly timeoutMs: number;

  public constructor(
    apiKey = env.GEMINI_API_KEY,
    model = env.GEMINI_MODEL,
    timeoutMs = env.AI_GEMINI_TIMEOUT_MS,
  ) {
    this.configuredModel = model || "gemini-3.5-flash";
    this.timeoutMs = timeoutMs;
    this.modelInformation = {
      provider: "Gemini",
      model: this.configuredModel,
      version: "1.0.0",
    };

    if (apiKey && apiKey.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey: apiKey.trim() });
      this.status = "configured";
    } else {
      this.client = null;
      this.status = "not_configured";
    }
  }

  public async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    const client = this.getClient();
    const targetModel = request.model ?? this.configuredModel;
    const startedAt = Date.now();
    let retryCount = 0;

    const thinkingBudget = resolveThinkingBudget(
      request.thinkingBudget,
      request.thinkingLevel,
    );

    const requestedOutputTokens = request.maxOutputTokens ?? 1024;
    // In Gemini 2.x/3.x, maxOutputTokens covers BOTH thinking tokens and generated response tokens.
    // Ensure the total budget provides sufficient capacity for both stages.
    const geminiMaxOutputTokens =
      thinkingBudget !== undefined && thinkingBudget > 0
        ? Math.max(2048, thinkingBudget + requestedOutputTokens)
        : requestedOutputTokens;

    logger.debug("Configuring Gemini request", {
      model: targetModel,
      geminiMaxOutputTokens,
      requestedOutputTokens,
      thinkingBudget,
      hasResponseSchema: Boolean(request.responseSchema),
      responseMimeType: request.responseMimeType ?? "application/json",
    });

    const executeOperation = async (): Promise<GenerateTextResponse> => {
      try {
        const config: Record<string, unknown> = {
          responseMimeType: request.responseMimeType ?? "application/json",
          temperature: request.temperature ?? 0.1,
          maxOutputTokens: geminiMaxOutputTokens,
        };

        if (request.topP !== undefined) {
          config.topP = request.topP;
        }

        if (request.responseSchema) {
          config.responseSchema = request.responseSchema;
        }

        if (thinkingBudget !== undefined && thinkingBudget > 0) {
          config.thinkingConfig = {
            thinkingBudget,
          };
        } else if (thinkingBudget === 0) {
          config.thinkingConfig = {
            thinkingBudget: 0,
          };
        }

        const response = await withTimeout(
          client.models.generateContent({
            model: targetModel,
            contents: request.input,
            config,
          }),
          this.timeoutMs,
        );

        const candidate = response.candidates?.[0];
        const finishReason = normalizeFinishReason(candidate?.finishReason);
        const usage = toUsageMetadata(response.usageMetadata);
        const text = response.text?.trim() ?? "";

        logger.debug("Gemini response extracted", {
          provider: "Gemini",
          model: targetModel,
          rawResponseLength: text.length,
          finishReason,
          candidateCount: response.candidates?.length ?? 0,
          geminiMaxOutputTokens,
          thinkingBudget,
          usage,
        });

        if (finishReason === "MAX_TOKENS") {
          logger.warn(
            "Gemini generation reached MAX_TOKENS limit. Output may be truncated.",
            {
              provider: "Gemini",
              model: targetModel,
              rawResponseLength: text.length,
              geminiMaxOutputTokens,
              finishReason,
              usage,
            },
          );
        }

        if (!text) {
          throw new AIProviderError(
            "The AI provider returned an empty response",
          );
        }

        this.status = "healthy";

        return {
          text,
          finishReason,
          usage,
          model: {
            provider: "Gemini",
            model: targetModel,
            version: response.modelVersion ?? "1.0.0",
          },
          retryCount,
          latencyMs: Date.now() - startedAt,
        };
      } catch (error) {
        throw mapProviderError(error, targetModel);
      }
    };

    return withRetry(
      executeOperation,
      2,
      500,
      (count) => {
        retryCount = count;
      },
    );
  }

  public async healthCheck(): Promise<ProviderHealth> {
    if (!this.client) {
      return {
        provider: "Gemini",
        model: this.configuredModel,
        status: "not_configured",
        version: "1.0.0",
        isAvailable: false,
      };
    }

    return {
      provider: "Gemini",
      model: this.configuredModel,
      status: this.status === "offline" ? "offline" : "healthy",
      version: "1.0.0",
      isAvailable: this.status !== "offline",
    };
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      throw new AIProviderError(
        "Gemini is not configured. Add GEMINI_API_KEY to the API environment.",
        503,
      );
    }

    return this.client;
  }
}

function resolveThinkingBudget(
  explicitBudget?: number,
  level?: ThinkingLevel,
): number | undefined {
  if (explicitBudget !== undefined) {
    return explicitBudget;
  }

  const resolvedLevel = level ?? (env.AI_THINKING_LEVEL as ThinkingLevel);

  switch (resolvedLevel) {
    case "none":
      return 0;
    case "low":
      return 256;
    case "medium":
      return 1024;
    case "high":
      return 2048;
    default:
      return 1024;
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new AIProviderTimeoutError()),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
  onRetry?: (retryCount: number) => void,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries || !isTransientError(error)) {
        throw error;
      }
      onRetry?.(attempt);
      const delayMs =
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      logger.warn(
        `Gemini transient error encountered, retrying (${attempt}/${maxRetries}) after ${Math.round(delayMs)}ms...`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      await sleep(delayMs);
    }
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof AIRateLimitError) {
    return true;
  }
  if (error instanceof AIProviderTimeoutError) {
    return true;
  }
  if (error instanceof ApiError) {
    // 404, 401, 403, 400 are non-transient configuration errors
    if (
      error.status === 404 ||
      error.status === 401 ||
      error.status === 403 ||
      error.status === 400
    ) {
      return false;
    }

    return (
      error.status === 429 ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    );
  }
  if (error instanceof AIProviderError) {
    if (
      error.statusCode === 404 ||
      error.statusCode === 401 ||
      error.statusCode === 403 ||
      error.statusCode === 400
    ) {
      return false;
    }
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapProviderError(error: unknown, targetModel: string): Error {
  if (error instanceof AIProviderError) {
    return error;
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      logger.error("Gemini model not found (HTTP 404)", {
        provider: "Gemini",
        model: targetModel,
        operation: "generateContent",
        status: 404,
        message: error.message,
      });
      return new AIProviderError(
        `Gemini model '${targetModel}' not found or unavailable (HTTP 404). Please verify GEMINI_MODEL configuration.`,
        404,
      );
    }

    if (error.status === 429) {
      return new AIRateLimitError();
    }

    if (error.status === 408 || error.status === 504) {
      return new AIProviderTimeoutError();
    }

    if (error.status === 401 || error.status === 403) {
      return new AIProviderError(
        "Gemini authentication failed. Please verify GEMINI_API_KEY.",
        401,
      );
    }

    if (error.status >= 500) {
      return new AIProviderError(
        `Gemini service error (HTTP ${error.status}).`,
        503,
      );
    }

    return new AIProviderError(
      `Gemini request failed (HTTP ${error.status}).`,
      error.status,
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("is no longer available")
    ) {
      logger.error("Gemini model unavailable or not found", {
        provider: "Gemini",
        model: targetModel,
        message: error.message,
      });
      return new AIProviderError(
        `Gemini model '${targetModel}' not found or unavailable (HTTP 404). Please verify GEMINI_MODEL configuration.`,
        404,
      );
    }
    if (
      msg.includes("api key") ||
      msg.includes("unauthorized") ||
      msg.includes("permission_denied")
    ) {
      return new AIProviderError(
        "Gemini authentication failed. Please verify GEMINI_API_KEY.",
        401,
      );
    }
    if (
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("rate limit")
    ) {
      return new AIRateLimitError();
    }
    if (
      msg.includes("timeout") ||
      msg.includes("timed out") ||
      msg.includes("deadline_exceeded")
    ) {
      return new AIProviderTimeoutError();
    }
  }

  return new AIProviderError();
}

function normalizeFinishReason(value: unknown): FinishReason {
  const finishReasons: FinishReason[] = [
    "STOP",
    "MAX_TOKENS",
    "SAFETY",
    "RECITATION",
    "OTHER",
    "UNKNOWN",
  ];

  return typeof value === "string" &&
    finishReasons.includes(value as FinishReason)
    ? (value as FinishReason)
    : "UNKNOWN";
}

function toUsageMetadata(
  usage:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined,
): UsageMetadata | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    totalTokens: usage.totalTokenCount ?? 0,
  };
}
