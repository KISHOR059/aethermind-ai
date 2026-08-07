import { env } from "../../../config/env.js";
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
  ProviderStatus,
  UsageMetadata,
} from "./types.js";

import { logger } from "../../../lib/logger.js";

type OllamaResponse = {
  model?: unknown;
  response?: unknown;
  done_reason?: unknown;
  prompt_eval_count?: unknown;
  eval_count?: unknown;
};

export class OllamaProvider implements AIProvider {
  public readonly modelInformation: ModelInformation;
  public status: ProviderStatus;

  public constructor(
    baseUrl = env.OLLAMA_BASE_URL,
    private readonly configuredModel = env.OLLAMA_MODEL,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.modelInformation = {
      provider: "Ollama",
      model: configuredModel,
      version: "1.0.0",
    };
    this.status = this.baseUrl && configuredModel ? "healthy" : "not_configured";
  }

  private readonly baseUrl: string;

  public async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    if (this.status === "not_configured") {
      throw new AIProviderError(
        "Ollama is not configured. Add OLLAMA_BASE_URL and OLLAMA_MODEL to the API environment.",
        503,
      );
    }

    const model = request.model ?? this.configuredModel;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      env.OLLAMA_REQUEST_TIMEOUT_MS,
    );

    const payload = {
      model,
      prompt: request.input,
      stream: false,
      format: "json",
      options: {
        temperature: request.temperature ?? 0.1,
        top_p: request.topP ?? 0.9,
        num_predict: request.maxOutputTokens ?? 768,
        num_ctx: request.numCtx ?? 4096,
        mirostat: 0,
      },
    };

    logger.info("Ollama API Request Payload", {
      model: payload.model,
      format: payload.format,
      promptLength: payload.prompt.length,
      options: payload.options,
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        await readResponseBody(response);
        this.status = response.status >= 500 ? "offline" : "configured";

        if (response.status === 429) {
          throw new AIRateLimitError();
        }

        throw new AIProviderError(
          `Ollama request failed with HTTP ${response.status}`,
          response.status >= 500 ? 502 : response.status,
        );
      }

      let data: OllamaResponse;
      try {
        data = (await response.json()) as OllamaResponse;
      } catch {
        this.status = "offline";
        throw new AIProviderError("Ollama returned invalid JSON");
      }

      const text = normalizeResponseText(data.response);
      if (!text) {
        throw new AIProviderError("Ollama returned an empty response");
      }

      this.status = "healthy";

      return {
        text,
        finishReason: normalizeFinishReason(data.done_reason),
        usage: toUsageMetadata(data),
        model: {
          provider: "Ollama",
          model: typeof data.model === "string" ? data.model : model,
          version: "1.0.0",
        },
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (isAbortError(error)) {
        this.status = "offline";
        throw new AIProviderTimeoutError();
      }

      this.status = "offline";
      throw new AIProviderError(
        isConnectionRefused(error)
          ? "Ollama is unavailable. Start Ollama and verify OLLAMA_BASE_URL."
          : "Ollama is unavailable.",
        503,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    return typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    return response.statusText;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isConnectionRefused(error: unknown): boolean {
  if (!(error instanceof TypeError)) {
    return false;
  }

  const cause = error.cause as { code?: unknown } | undefined;
  return cause?.code === "ECONNREFUSED";
}

function normalizeFinishReason(value: unknown): FinishReason {
  switch (value) {
    case "stop":
      return "STOP";
    case "length":
      return "MAX_TOKENS";
    default:
      return "UNKNOWN";
  }
}

function toUsageMetadata(data: OllamaResponse): UsageMetadata | undefined {
  const inputTokens = toNumber(data.prompt_eval_count);
  const outputTokens = toNumber(data.eval_count);

  if (inputTokens === undefined && outputTokens === undefined) {
    return undefined;
  }

  return {
    inputTokens: inputTokens ?? 0,
    outputTokens: outputTokens ?? 0,
    totalTokens: (inputTokens ?? 0) + (outputTokens ?? 0),
  };
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeResponseText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const text = value.replace(/^\uFEFF/, "").trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return (fenced?.[1] ?? text).trim();
}
