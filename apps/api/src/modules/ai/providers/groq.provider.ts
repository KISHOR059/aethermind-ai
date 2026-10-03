import { APIError, Groq } from "groq-sdk";

import { env } from "../../../config/env.js";
import { logger } from "../../../lib/logger.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
} from "../../../utils/app-error.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { GroqKeyPool } from "./groq-key-pool.js";
import type {
  FinishReason,
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderHealth,
  ProviderStatus,
  UsageMetadata,
} from "./types.js";

export class GroqProvider implements AIProvider {
  public readonly modelInformation: ModelInformation;
  public status: ProviderStatus;

  private readonly keyPool: GroqKeyPool;
  private readonly configuredModel: string;
  private readonly timeoutMs: number;

  public constructor(
    apiKey: string | string[] = [
      env.GROQ_API_KEY,
      env.GROQ_API_KEY_FALLBACK_1,
      env.GROQ_API_KEY_FALLBACK_2,
    ],
    model = env.GROQ_MODEL,
    timeoutMs = env.AI_GROQ_TIMEOUT_MS,
    fallbackKeys?: string[],
  ) {
    this.configuredModel = model || "llama-3.3-70b-versatile";
    this.timeoutMs = timeoutMs;
    this.modelInformation = {
      provider: "Groq",
      model: this.configuredModel,
      version: "1.0.0",
    };

    const keysToPool: string[] = [];
    if (Array.isArray(apiKey)) {
      keysToPool.push(...apiKey);
    } else if (typeof apiKey === "string" && apiKey.trim().length > 0) {
      keysToPool.push(apiKey);
    }

    if (Array.isArray(fallbackKeys)) {
      keysToPool.push(...fallbackKeys);
    }

    this.keyPool = new GroqKeyPool(keysToPool);
    this.status = this.keyPool.isConfigured ? "configured" : "not_configured";
  }

  public async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    if (!this.keyPool.isConfigured) {
      throw new AIProviderError(
        "Groq is not configured. Add GROQ_API_KEY to the API environment.",
        503,
      );
    }

    const targetModel = request.model ?? this.configuredModel;
    const startedAt = Date.now();
    let totalRetryCount = 0;

    const requestedOutputTokens = request.maxOutputTokens ?? 4096;

    logger.debug("Configuring Groq request", {
      model: targetModel,
      maxOutputTokens: requestedOutputTokens,
      hasResponseSchema: Boolean(request.responseSchema),
      responseMimeType: request.responseMimeType ?? "application/json",
      configuredKeySlots: this.keyPool.size,
    });

    const executeWithClient = async (
      client: Groq,
      slot: number,
    ): Promise<GenerateTextResponse> => {
      // Build request body for Groq chat completions
      const messages: { role: "system" | "user"; content: string }[] = [
        {
          role: "user",
          content: request.input,
        },
      ];

      const isJsonRequested =
        request.responseMimeType === "application/json" ||
        Boolean(request.responseSchema);

      const params: Parameters<typeof client.chat.completions.create>[0] = {
        model: targetModel,
        messages,
        temperature: request.temperature ?? 0.1,
        max_tokens: requestedOutputTokens,
      };

      if (request.topP !== undefined) {
        params.top_p = request.topP;
      }

      if (isJsonRequested) {
        params.response_format = { type: "json_object" };
      }

      const response = await withTimeout(
        client.chat.completions.create({
          ...params,
          stream: false,
        }),
        this.timeoutMs,
      );

      const choice = response.choices?.[0];
      const finishReason = normalizeFinishReason(choice?.finish_reason);
      const usage = toUsageMetadata(response.usage);
      const text = choice?.message?.content?.trim() ?? "";

      logger.debug("Groq response extracted", {
        provider: "Groq",
        model: targetModel,
        keySlot: slot,
        rawResponseLength: text.length,
        finishReason,
        usage,
      });

      if (finishReason === "MAX_TOKENS") {
        logger.warn(
          "Groq generation reached MAX_TOKENS limit. Output may be truncated.",
          {
            provider: "Groq",
            model: targetModel,
            keySlot: slot,
            requestedOutputTokens,
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
          provider: "Groq",
          model: targetModel,
          version: "1.0.0",
        },
        retryCount: totalRetryCount,
        latencyMs: Date.now() - startedAt,
      };
    };

    const clients = this.keyPool.getClients();

    // Mode 1: Single configured key (with standard transient retry loop)
    if (clients.length === 1) {
      const { client, slot } = clients[0];
      const singleKeyOp = async (): Promise<GenerateTextResponse> => {
        try {
          return await executeWithClient(client, slot);
        } catch (error) {
          throw mapProviderError(error, targetModel);
        }
      };

      return withRetry(
        singleKeyOp,
        2,
        500,
        (count) => {
          totalRetryCount = count;
        },
      );
    }

    // Mode 2: Multi-key fallback pool (Controlled failover: Slot 1 -> Slot 2 -> Slot 3)
    let lastError: unknown;
    for (let i = 0; i < clients.length; i++) {
      const { client, slot } = clients[i];
      const hasNextSlot = i < clients.length - 1;
      const nextSlot = hasNextSlot ? clients[i + 1].slot : null;

      try {
        return await executeWithClient(client, slot);
      } catch (error) {
        lastError = error;
        totalRetryCount = i;

        // Permanent request/configuration errors (e.g. 400, 404): do not fail over
        if (isPermanentError(error)) {
          throw mapProviderError(error, targetModel);
        }

        // Authentication failures (401, 403): fail over to next slot
        if (isAuthError(error)) {
          if (hasNextSlot) {
            logger.warn(
              `Groq key slot ${slot} failed with authentication error (HTTP 401/403); trying fallback slot ${nextSlot}...`,
            );
            continue;
          }
          throw mapProviderError(error, targetModel);
        }

        // Retryable / Transient errors (429 rate limit, 500, 502, 503, 504, timeout): fail over to next slot
        if (isTransientError(error)) {
          const reason = getErrorStatusOrReason(error);
          if (hasNextSlot) {
            logger.warn(
              `Groq key slot ${slot} failed with ${reason}; failing over to fallback slot ${nextSlot}...`,
            );
            continue;
          }
          throw mapProviderError(error, targetModel);
        }

        // Unexpected errors: try next slot if available
        if (hasNextSlot) {
          logger.warn(
            `Groq key slot ${slot} failed with unexpected error; trying fallback slot ${nextSlot}...`,
            { error: error instanceof Error ? error.message : String(error) },
          );
          continue;
        }

        throw mapProviderError(error, targetModel);
      }
    }

    throw mapProviderError(
      lastError ?? new Error("All Groq key slots exhausted"),
      targetModel,
    );
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const startedAt = Date.now();
    const primaryClient = this.keyPool.getPrimaryClient();

    if (!primaryClient) {
      this.status = "not_configured";
      return {
        provider: "Groq",
        model: this.configuredModel,
        status: "not_configured",
        version: "1.0.0",
        isAvailable: false,
      };
    }

    try {
      await withTimeout(
        primaryClient.models.list(),
        Math.min(this.timeoutMs, 5000),
      );

      this.status = "healthy";
      return {
        provider: "Groq",
        model: this.configuredModel,
        status: "healthy",
        version: "1.0.0",
        isAvailable: true,
        latencyMs: Date.now() - startedAt,
      };
    } catch {
      this.status = "offline";
      return {
        provider: "Groq",
        model: this.configuredModel,
        status: "offline",
        version: "1.0.0",
        isAvailable: false,
        latencyMs: Date.now() - startedAt,
      };
    }
  }
}

function normalizeFinishReason(reason?: string | null): FinishReason {
  switch (reason) {
    case "stop":
      return "STOP";
    case "length":
      return "MAX_TOKENS";
    case "content_filter":
      return "SAFETY";
    default:
      return "UNKNOWN";
  }
}

function toUsageMetadata(usage?: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}): UsageMetadata | undefined {
  if (!usage) {
    return undefined;
  }
  return {
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

function isPermanentError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 400 || error.status === 404;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("bad request") ||
      msg.includes("invalid argument") ||
      msg.includes("404") ||
      msg.includes("model not found")
    );
  }
  return false;
}

function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 401 || error.status === 403;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("401") ||
      msg.includes("403") ||
      msg.includes("unauthorized") ||
      msg.includes("invalid api key") ||
      msg.includes("permission_denied")
    );
  }
  return false;
}

function getErrorStatusOrReason(error: unknown): string {
  if (error instanceof AIRateLimitError) {
    return "rate limit (HTTP 429)";
  }
  if (error instanceof AIProviderTimeoutError) {
    return "timeout (HTTP 504)";
  }
  if (error instanceof APIError) {
    return `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "transient error";
}

function isTransientError(error: unknown): boolean {
  if (error instanceof AIRateLimitError || error instanceof AIProviderTimeoutError) {
    return true;
  }
  if (error instanceof APIError) {
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
      error.status === 408 ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    );
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("quota") ||
      msg.includes("503") ||
      msg.includes("500") ||
      msg.includes("502") ||
      msg.includes("504") ||
      msg.includes("timeout") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout")
    );
  }
  return false;
}

function mapProviderError(error: unknown, model: string): Error {
  if (
    error instanceof AIRateLimitError ||
    error instanceof AIProviderTimeoutError ||
    error instanceof AIProviderError
  ) {
    return error;
  }

  if (error instanceof APIError) {
    if (error.status === 429) {
      return new AIRateLimitError();
    }
    if (error.status === 408 || error.status === 504) {
      return new AIProviderTimeoutError();
    }
    if (error.status === 401 || error.status === 403) {
      return new AIProviderError(
        "Groq authentication failed. Please verify GROQ_API_KEY.",
        401,
      );
    }
    if (error.status === 404) {
      return new AIProviderError(
        `Configured Groq model '${model}' was not found.`,
        404,
      );
    }
    return new AIProviderError(
      `Groq request failed with status ${error.status}: ${error.message}`,
      error.status,
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("timeout")) {
      return new AIProviderTimeoutError();
    }
    return new AIProviderError(`Groq error: ${error.message}`, 500);
  }

  return new AIProviderError("Unknown Groq error occurred", 500);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AIProviderTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
  onRetry?: (count: number) => void,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !isTransientError(error)) {
        throw error;
      }
      attempt += 1;
      onRetry?.(attempt);
      const jitter = Math.floor(Math.random() * 200);
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      logger.warn(`Retrying Groq request (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
