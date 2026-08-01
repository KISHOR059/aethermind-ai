import { ApiError, GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
} from "../../../utils/app-error.js";
import type { AIProvider } from "./ai-provider.interface.js";
import type {
  GenerateTextRequest,
  GenerateTextResponse,
  StructuredGenerationRequest,
} from "./types.js";
import type {
  FinishReason,
  ModelInformation,
  ProviderStatus,
  UsageMetadata,
} from "./types.js";

export class GeminiProvider implements AIProvider {
  public readonly modelInformation: ModelInformation = {
    provider: "Gemini",
    model: env.GEMINI_MODEL,
    version: "1.0.0",
  };

  public readonly status: ProviderStatus;

  private readonly client: GoogleGenAI | null;

  public constructor() {
    this.client = env.GEMINI_API_KEY
      ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
      : null;
    this.status = this.client ? "configured" : "not_configured";
  }

  public async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    const client = this.getClient();

    try {
      const response = await withTimeout(
        client.models.generateContent({
          model: request.model ?? env.GEMINI_MODEL,
          contents: request.input,
          config: {
            responseMimeType: "application/json",
            temperature: request.temperature ?? 0.2,
            maxOutputTokens: request.maxOutputTokens ?? 2_048,
          },
        }),
        env.AI_REQUEST_TIMEOUT_MS,
      );
      const text = response.text?.trim();

      if (!text) {
        throw new AIProviderError("The AI provider returned an empty response");
      }

      return {
        text,
        finishReason: normalizeFinishReason(
          response.candidates?.[0]?.finishReason,
        ),
        usage: toUsageMetadata(response.usageMetadata),
        model: {
          provider: "Gemini",
          model: request.model ?? env.GEMINI_MODEL,
          version: response.modelVersion ?? "1.0.0",
        },
      };
    } catch (error) {
      throw mapProviderError(error);
    }
  }

  public async generateStructuredOutput<T>(
    _request: StructuredGenerationRequest<T>,
  ): Promise<T> {
    void _request;
    throw new AIProviderError(
      "Structured AI generation is not enabled yet",
    );
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

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new AIProviderTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function mapProviderError(error: unknown): Error {
  if (error instanceof AIProviderError) {
    return error;
  }

  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new AIRateLimitError();
    }

    if (error.status === 408 || error.status === 504) {
      return new AIProviderTimeoutError();
    }

    return new AIProviderError();
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

  return typeof value === "string" && finishReasons.includes(value as FinishReason)
    ? (value as FinishReason)
    : "UNKNOWN";
}

function toUsageMetadata(
  usage: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | undefined,
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
