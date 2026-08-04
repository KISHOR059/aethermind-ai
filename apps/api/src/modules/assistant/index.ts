import { aiService } from "../ai/index.js";
import { AssistantController } from "./assistant.controller.js";
import { AssistantService } from "./assistant.service.js";

export const assistantService = new AssistantService(aiService);
export const assistantController = new AssistantController(assistantService);

export { AssistantController } from "./assistant.controller.js";
export { AssistantService } from "./assistant.service.js";
export default assistantService;
