import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";
import { ContextBuilder } from "./context/context-builder.js";
import { ResponseParser } from "./parser/response-parser.js";
import { AIPipeline } from "./pipeline/ai-pipeline.js";
import { PromptBuilder } from "./prompt/prompt-builder.js";
import { createAIProvider } from "./providers/provider.factory.js";

const aiProvider = createAIProvider();
const contextBuilder = new ContextBuilder();
const promptBuilder = new PromptBuilder();
const responseParser = new ResponseParser();
const aiPipeline = new AIPipeline({
  contextBuilder,
  promptBuilder,
  aiProvider,
  responseParser,
});

const aiService = new AiService(aiPipeline, aiProvider);

export const aiController = new AiController(aiService);

export { AiController } from "./ai.controller.js";
export { AiService } from "./ai.service.js";
export { buildDailyPlannerContext } from "./context/index.js";
export { createAIProvider } from "./providers/provider.factory.js";
export { buildDailyPlannerPrompt } from "./prompt/index.js";
export { AIPipeline } from "./pipeline/index.js";
export { parseResponse } from "./parser/index.js";
