import type { z } from "zod";
import type { ContextBuilder } from "../context/context-builder.js";
import { logger } from "../../../lib/logger.js";
import { AIParseError } from "../parser/response.types.js";
import type { ResponseParser } from "../parser/response-parser.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
import type { BuiltPrompt } from "../prompt/prompt.types.js";
import { AIResponseError } from "../../../utils/app-error.js";
import type { AIProvider } from "../providers/ai-provider.interface.js";
import { aiCacheService, AICacheService } from "../cache/ai-cache.js";
import {
  pipelinePromptRegistry,
  type PipelinePromptRegistry,
} from "./pipeline-prompt.registry.js";
import type {
  AIExecutionRequest,
  AIExecutionResult,
  PipelinePromptId,
  PipelineResultMap,
} from "./pipeline.types.js";

export type AIPipelineDependencies = {
  readonly contextBuilder: ContextBuilder;
  readonly promptBuilder: PromptBuilder;
  readonly aiProvider: AIProvider;
  readonly responseParser: ResponseParser;
  readonly promptRegistry?: PipelinePromptRegistry;
  readonly aiCache?: AICacheService;
};

export class AIPipeline {
  private readonly promptRegistry: PipelinePromptRegistry;
  private readonly aiCache: AICacheService;

  public constructor(private readonly dependencies: AIPipelineDependencies) {
    this.promptRegistry =
      dependencies.promptRegistry ?? pipelinePromptRegistry;
    this.aiCache = dependencies.aiCache ?? aiCacheService;
  }

  public async execute<TPrompt extends PipelinePromptId>(
    request: AIExecutionRequest<TPrompt>,
  ): Promise<AIExecutionResult<PipelineResultMap[TPrompt]>> {
    const startedAt = Date.now();

    // Stage 1: Context Building
    const tContextStart = Date.now();
    const rawContext =
      request.prompt === "task-breakdown" && request.taskId
        ? await this.dependencies.contextBuilder.buildTaskBreakdownContext(
            request.userId,
            request.taskId,
          )
        : await this.dependencies.contextBuilder.buildDailyPlannerContext(
            request.userId,
          );

    const context = {
      ...rawContext,
      ...(request.userMessage !== undefined ? { userMessage: request.userMessage } : {}),
      ...(request.conversationHistory !== undefined
        ? { conversationHistory: request.conversationHistory }
        : {}),
    };
    const contextTimeMs = Date.now() - tContextStart;

    // Check Cache
    const promptDefinition = this.promptRegistry[request.prompt];
    const cacheKey = this.aiCache.getCacheKey(request, context);
    if (promptDefinition.ttlMs) {
      const cachedResult = this.aiCache.get<PipelineResultMap[TPrompt]>(cacheKey);
      if (cachedResult) {
        const totalTimeMs = Date.now() - startedAt;
        logger.info("AI Pipeline Cache Hit", {
          promptId: request.prompt,
          userId: request.userId,
          contextTimeMs,
          totalTimeMs,
        });
        return {
          data: cachedResult.data,
          metrics: {
            ...cachedResult.metrics,
            executionTime: totalTimeMs,
            stageTimings: {
              contextTimeMs,
              promptTimeMs: 0,
              llmTimeMs: 0,
              parseTimeMs: 0,
              totalTimeMs,
              cached: true,
            },
          },
        };
      }
    }

    // Stage 2: Prompt Building
    const tPromptStart = Date.now();
    const builtPrompt = (promptDefinition.buildPrompt as (
      ctx: typeof context,
      pb: PromptBuilder,
    ) => BuiltPrompt)(context, this.dependencies.promptBuilder);

    const serializedInput = serializePrompt(builtPrompt.fragments);
    const promptTimeMs = Date.now() - tPromptStart;

    logger.info("Executing AI Pipeline", {
      promptId: request.prompt,
      userId: request.userId,
      userMessage: request.userMessage,
      hasConversationHistory: Boolean(request.conversationHistory),
      serializedPromptLength: serializedInput.length,
      contextTimeMs,
      promptTimeMs,
    });

    logger.debug("Final Prompt Sent to Provider", {
      promptId: request.prompt,
      finalPrompt: serializedInput,
    });

    try {
      // Stage 3: LLM Inference (AI Provider)
      const tLlmStart = Date.now();
      const providerResponse = await this.dependencies.aiProvider.generateText({
        input: serializedInput,
        temperature: promptDefinition.options?.temperature ?? 0.1,
        topP: promptDefinition.options?.topP ?? 0.9,
        maxOutputTokens: promptDefinition.options?.maxOutputTokens ?? 1024,
        numCtx: promptDefinition.options?.numCtx ?? 4096,
        thinkingLevel: promptDefinition.options?.thinkingLevel,
        responseMimeType: "application/json",
        responseSchema: promptDefinition.responseSchema,
      });
      const llmTimeMs = Date.now() - tLlmStart;

      logger.info("AI Provider Raw Response Received", {
        promptId: request.prompt,
        rawResponseLength: providerResponse.text.length,
        finishReason: providerResponse.finishReason,
        llmTimeMs,
      });

      // Stage 4: Response Parsing
      const tParseStart = Date.now();
      let finalResponse = providerResponse;
      let data: PipelineResultMap[TPrompt];

      try {
        data = this.dependencies.responseParser.parse(
          providerResponse.text,
          promptDefinition.schema as z.ZodType<PipelineResultMap[TPrompt]>,
        );
        logger.debug("AI response parsed JSON", { parsedJson: data });
      } catch (error) {
        if (error instanceof AIParseError && error.code === "INVALID_JSON") {
          logger.warn("AI response is invalid JSON, attempting single retry", {
            rawResponse: providerResponse.text,
            error: error.message,
            finishReason: providerResponse.finishReason,
          });

          const retryPrompt =
            "The previous response was not valid JSON. Return ONLY valid JSON that matches the schema.";
          const retryInput = serializePrompt([
            ...builtPrompt.fragments,
            { role: "assistant", content: providerResponse.text },
            { role: "user", content: retryPrompt },
          ]);

          try {
            finalResponse = await this.dependencies.aiProvider.generateText({
              input: retryInput,
              temperature: 0.1,
              topP: 0.9,
              maxOutputTokens: promptDefinition.options?.maxOutputTokens ?? 1024,
              numCtx: promptDefinition.options?.numCtx ?? 4096,
              thinkingLevel: promptDefinition.options?.thinkingLevel,
              responseMimeType: "application/json",
              responseSchema: promptDefinition.responseSchema,
            });

            data = this.dependencies.responseParser.parse(
              finalResponse.text,
              promptDefinition.schema as z.ZodType<PipelineResultMap[TPrompt]>,
            );
          } catch (retryError) {
            if (retryError instanceof AIParseError) {
              logger.error("AI response parsing failed after retry", {
                rawResponse: finalResponse.text,
                parserError: {
                  name: retryError.name,
                  message: retryError.message,
                  code: retryError.code,
                },
                missingOrInvalidFields: retryError.issues.map((issue) => ({
                  path: issue.path,
                  message: issue.message,
                  code: issue.code,
                })),
              });
              throw new AIResponseError([...retryError.issues]);
            }
            throw retryError;
          }
        } else if (error instanceof AIParseError) {
          logger.error("AI response parsing failed", {
            rawResponse: providerResponse.text,
            parserError: {
              name: error.name,
              message: error.message,
              code: error.code,
            },
            missingOrInvalidFields: error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
              code: issue.code,
            })),
          });
          throw new AIResponseError([...error.issues]);
        } else {
          throw error;
        }
      }

      const parseTimeMs = Date.now() - tParseStart;
      const totalTimeMs = Date.now() - startedAt;

      logger.info("AI Pipeline Timing Breakdown", {
        promptId: request.prompt,
        userId: request.userId,
        provider: finalResponse.model.provider,
        model: finalResponse.model.model,
        fallbackUsed: Boolean(finalResponse.fallbackUsed),
        primaryProvider: finalResponse.primaryProvider,
        retryCount: finalResponse.retryCount,
        finishReason: finalResponse.finishReason,
        outputTokenCount: finalResponse.usage?.outputTokens,
        inputTokenCount: finalResponse.usage?.inputTokens,
        totalTokens: finalResponse.usage?.totalTokens,
        contextTimeMs,
        promptTimeMs,
        llmTimeMs,
        parseTimeMs,
        totalTimeMs,
      });

      const result: AIExecutionResult<PipelineResultMap[TPrompt]> = {
        data,
        metrics: {
          executionTime: totalTimeMs,
          provider: finalResponse.model.provider,
          model: finalResponse.model.model,
          tokenUsage: finalResponse.usage ?? null,
          promptVersion: builtPrompt.version,
          fallbackUsed: finalResponse.fallbackUsed,
          primaryProvider: finalResponse.primaryProvider,
          fallbackReason: finalResponse.fallbackReason,
          retryCount: finalResponse.retryCount,
          stageTimings: {
            contextTimeMs,
            promptTimeMs,
            llmTimeMs,
            parseTimeMs,
            totalTimeMs,
            cached: false,
          },
        },
      };

      if (promptDefinition.ttlMs) {
        this.aiCache.set(cacheKey, result, promptDefinition.ttlMs);
      }

      return result;
    } catch (error) {
      if (error instanceof AIResponseError) {
        throw error;
      }

      if (error instanceof AIParseError) {
        throw new AIResponseError([...error.issues]);
      }

      throw error;
    }
  }
}

function serializePrompt(
  fragments: readonly { role: string; content: string }[],
): string {
  return fragments
    .map(
      (fragment) =>
        fragment.role.toUpperCase() + ":\n" + fragment.content,
    )
    .join("\n\n");
}
