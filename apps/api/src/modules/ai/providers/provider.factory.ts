import type { AIProvider } from "./ai-provider.interface.js";
import { GeminiProvider } from "./gemini.provider.js";

export function createAIProvider(): AIProvider {
  return new GeminiProvider();
}
