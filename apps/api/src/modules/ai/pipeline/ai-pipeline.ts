import type { ContextBuilder } from "../context/context-builder.js";
import { logger } from "../../../lib/logger.js";
import { AIParseError } from "../parser/response.types.js";
import type { ResponseParser } from "../parser/response-parser.js";
import type { PromptBuilder } from "../prompt/prompt-builder.js";
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
      await this.dependencies.contextBuilder.buildDailyPlannerContext(
        request.userId,
      );
    const promptDefinition = this.promptRegistry[request.prompt];
    const builtPrompt = promptDefinition.buildPrompt(
      context,
      this.dependencies.promptBuilder,
    );

    try {
      const providerResponse = await this.dependencies.aiProvider.generateText({
        input: serializePrompt(builtPrompt.fragments),
      });
      logger.debug("AI response before parsing", {
        rawResponse: providerResponse.text,
      });

      let data: PipelineResultMap[TPrompt];
      try {
        data = this.dependencies.responseParser.parse(
          providerResponse.text,
          promptDefinition.schema,
        );
        logger.debug("AI response parsed JSON", { parsedJson: data });
      } catch (error) {
        if (error instanceof AIParseError) {
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
        }

        throw error;
      }

      return {
        data,
        metrics: createMetrics(
          startedAt,
          providerResponse,
          builtPrompt.version,
        ),
      };
    } catch (error) {
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
