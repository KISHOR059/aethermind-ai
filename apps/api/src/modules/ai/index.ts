import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";

const aiService = new AiService();

export const aiController = new AiController(aiService);

export { AiController } from "./ai.controller.js";
export { AiService } from "./ai.service.js";
