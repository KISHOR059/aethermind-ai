import { logger } from "../../../lib/logger.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
  AppError,
  ValidationError,
} from "../../../utils/app-error.js";
import type { AIProvider } from "./ai-provider.interface.js";
import type {
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderHealth,
  ProviderStatus,
} from "./types.js";

export class FallbackProvider implements AIProvider {
  public constructor(
    private readonly primaryProvider: AIProvider,
    private readonly fallbackProvider: AIProvider | null = null,
  ) {}

  public get modelInformation(): ModelInformation {
    return this.primaryProvider.modelInformation;
  }

  public get status(): ProviderStatus {
    return this.primaryProvider.status !== "not_configured" &&
      this.primaryProvider.status !== "offline"
      ? this.primaryProvider.status
      : this.fallbackProvider?.status ?? this.primaryProvider.status;
  }

  public async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    try {
      const response = await this.primaryProvider.generateText(request);
      return {
        ...response,
        fallbackUsed: false,
      };
    } catch (primaryError) {
      if (!this.fallbackProvider || !this.isEligibleForFallback(primaryError)) {
        throw primaryError;
      }

      const primaryName = this.primaryProvider.modelInformation.provider;
      const fallbackName = this.fallbackProvider.modelInformation.provider;
      const reason =
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError);

      logger.warn(`Primary AI provider (${primaryName}) failed. Triggering fallback to ${fallbackName}...`, {
        primaryProvider: primaryName,
        fallbackProvider: fallbackName,
        error: reason,
      });

      try {
        const fallbackResponse =
          await this.fallbackProvider.generateText(request);

        logger.info(`Fallback AI provider (${fallbackName}) completed request successfully.`, {
          primaryProvider: primaryName,
          fallbackProvider: fallbackName,
          model: fallbackResponse.model.model,
        });

        return {
          ...fallbackResponse,
          fallbackUsed: true,
          primaryProvider: primaryName,
          fallbackReason: reason,
        };
      } catch (fallbackError) {
        logger.error(`Fallback AI provider (${fallbackName}) also failed.`, {
          primaryProvider: primaryName,
          fallbackProvider: fallbackName,
          primaryError: reason,
          fallbackError:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });

        throw fallbackError;
      }
    }
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const primaryHealth = this.primaryProvider.healthCheck
      ? await this.primaryProvider.healthCheck()
      : {
          provider: this.primaryProvider.modelInformation.provider,
          model: this.primaryProvider.modelInformation.model,
          status: this.primaryProvider.status,
          version: this.primaryProvider.modelInformation.version,
          isAvailable: this.primaryProvider.status === "healthy",
        };

    const fallbackHealth = this.fallbackProvider?.healthCheck
      ? await this.fallbackProvider.healthCheck()
      : this.fallbackProvider
        ? {
            provider: this.fallbackProvider.modelInformation.provider,
            model: this.fallbackProvider.modelInformation.model,
            status: this.fallbackProvider.status,
            version: this.fallbackProvider.modelInformation.version,
            isAvailable: this.fallbackProvider.status === "healthy",
          }
        : undefined;

    return {
      provider: primaryHealth.provider,
      model: primaryHealth.model,
      status: primaryHealth.status,
      version: primaryHealth.version,
      isAvailable: primaryHealth.isAvailable || (fallbackHealth?.isAvailable ?? false),
      latencyMs: primaryHealth.latencyMs,
      fallback: fallbackHealth
        ? {
            provider: fallbackHealth.provider,
            model: fallbackHealth.model,
            status: fallbackHealth.status,
            isAvailable: fallbackHealth.isAvailable,
          }
        : undefined,
    };
  }

  private isEligibleForFallback(error: unknown): boolean {
    // Do not fallback on user validation errors or non-operational errors
    if (error instanceof ValidationError) {
      return false;
    }

    if (error instanceof AIRateLimitError || error instanceof AIProviderTimeoutError) {
      return true;
    }

    if (error instanceof AIProviderError) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return false;
      }
      // Fallback on 5xx, 429, or unavailable/unconfigured provider
      return error.statusCode >= 500 || error.statusCode === 429 || error.statusCode === 503;
    }

    // Network / Fetch / Connection errors
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("econnrefused") ||
        msg.includes("fetch failed") ||
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("unavailable") ||
        msg.includes("not configured")
      ) {
        return true;
      }
    }

    // If it's a generic AppError that is not 4xx client error
    if (error instanceof AppError) {
      return error.statusCode >= 500;
    }

    return true;
  }
}
