import type { z } from "zod";
import type { ContextBuilder } from "../context/context-builder.js";
import { logger } from "../../../lib/logger.js";
import { AIParseError } from "../parser/response.types.js";
import type { ResponseParser } from "../parser/response-parser.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
import type { BuiltPrompt } from "../prompt/prompt.types.js";
import { AIResponseError } from "../../../utils/app-error.js";
import type { AIProvider } from "../providers/ai-provider.interface.js";
import type { GenerateTextResponse } from "../providers/types.js";
import {
  pipelinePromptRegistry,
  type PipelinePromptRegistry,
} from "./pipeline-prompt.registry.js";
import type {
  AIExecutionMetrics,
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
};

export class AIPipeline {
  private readonly promptRegistry: PipelinePromptRegistry;

  public constructor(private readonly dependencies: AIPipelineDependencies) {
    this.promptRegistry =
      dependencies.promptRegistry ?? pipelinePromptRegistry;
  }

  public async execute<TPrompt extends PipelinePromptId>(
    request: AIExecutionRequest<TPrompt>,
  ): Promise<AIExecutionResult<PipelineResultMap[TPrompt]>> {
    const startedAt = Date.now();
    const context =
      request.prompt === "task-breakdown" && request.taskId
        ? await this.dependencies.contextBuilder.buildTaskBreakdownContext(
            request.userId,
            request.taskId,
          )
        : await this.dependencies.contextBuilder.buildDailyPlannerContext(
            request.userId,
          );
    const promptDefinition = this.promptRegistry[request.prompt];
    const builtPrompt = (promptDefinition.buildPrompt as (
      ctx: typeof context,
      pb: PromptBuilder,
    ) => BuiltPrompt)(context, this.dependencies.promptBuilder);

    try {
      const providerResponse = await this.dependencies.aiProvider.generateText({
        input: serializePrompt(builtPrompt.fragments),
      });
      logger.debug("AI response before parsing", {
        rawResponse: providerResponse.text,
      });

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
            });
            logger.debug("AI response on retry before parsing", {
              rawResponse: finalResponse.text,
            });

            data = this.dependencies.responseParser.parse(
              finalResponse.text,
              promptDefinition.schema as z.ZodType<PipelineResultMap[TPrompt]>,
            );
            logger.debug("AI response parsed JSON on retry", { parsedJson: data });
          } catch (retryError) {
            if (retryError instanceof AIParseError) {
              logger.error("AI response parsing failed after retry", {
                rawResponse: finalResponse.text,
                parserError: {
                  name: retryError.name,
                  message: retryError.message,
                  code: retryError.code,
                },
                schemaValidationError:
                  retryError.code === "SCHEMA_VALIDATION_FAILED"
                    ? retryError.message
                    : undefined,
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
            schemaValidationError:
              error.code === "SCHEMA_VALIDATION_FAILED"
                ? error.message
                : undefined,
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

      return {
        data,
        metrics: createMetrics(
          startedAt,
          finalResponse,
          builtPrompt.version,
        ),
      };
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

function createMetrics(
  startedAt: number,
  providerResponse: GenerateTextResponse,
  promptVersion: string,
): AIExecutionMetrics {
  return {
    executionTime: Date.now() - startedAt,
    provider: providerResponse.model.provider,
    model: providerResponse.model.model,
    tokenUsage: providerResponse.usage ?? null,
    promptVersion,
  };
}
