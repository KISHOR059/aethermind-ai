import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";
import { createAIProvider } from "./providers/provider.factory.js";

const aiProvider = createAIProvider();
const aiService = new AiService(aiProvider);

export const aiController = new AiController(aiService);

export { AiController } from "./ai.controller.js";
export { AiService } from "./ai.service.js";
export { createAIProvider } from "./providers/provider.factory.js";
