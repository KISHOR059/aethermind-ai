import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";
import { ContextBuilder } from "./context/context-builder.js";
import { ResponseParser } from "./parser/response-parser.js";
import { AIPipeline } from "./pipeline/ai-pipeline.js";
import { PromptBuilder } from "./prompt/prompt-builder.js";
import { createAIProvider } from "./providers/provider.factory.js";

const aiProvider = createAIProvider();
logger.info("AI provider initialized", {
  provider: aiProvider.modelInformation.provider,
  model: aiProvider.modelInformation.model,
  primary: env.AI_PROVIDER,
  fallback: env.AI_FALLBACK_PROVIDER,
  geminiTimeoutMs: env.AI_GEMINI_TIMEOUT_MS,
  ollamaTimeoutMs: env.AI_OLLAMA_TIMEOUT_MS,
  configured: aiProvider.status !== "not_configured",
});
const contextBuilder = new ContextBuilder();
const promptBuilder = new PromptBuilder();
const responseParser = new ResponseParser();
const aiPipeline = new AIPipeline({
  contextBuilder,
  promptBuilder,
  aiProvider,
  responseParser,
});

export const aiService = new AiService(aiPipeline, aiProvider);

export const aiController = new AiController(aiService);

export { AiController } from "./ai.controller.js";
export { AiService } from "./ai.service.js";
export {
  buildDailyPlannerContext,
  buildTaskBreakdownContext,
} from "./context/index.js";
export {
  createAIProvider,
  GeminiProvider,
  OllamaProvider,
  FallbackProvider,
} from "./providers/index.js";
export type {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
  ModelInformation,
  ProviderHealth,
  ProviderStatus,
  UsageMetadata,
} from "./providers/index.js";
export {
  buildDailyPlannerPrompt,
  buildPrioritizationPrompt,
  buildTaskBreakdownPrompt,
  buildSmartReschedulePrompt,
  buildWeeklyReviewPrompt,
  buildProductivityInsightsPrompt,
} from "./prompt/index.js";
export { AIPipeline } from "./pipeline/index.js";
export { parseResponse } from "./parser/index.js";


