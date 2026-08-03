import { env } from "../../../config/env.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OllamaProvider } from "./ollama.provider.js";

export function createAIProvider(): AIProvider {
  switch (env.AI_PROVIDER.toLowerCase()) {
    case "gemini":
      return new GeminiProvider();
    case "ollama":
      return new OllamaProvider();
    default:
      throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
  }
}
