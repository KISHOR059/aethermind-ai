import { env } from "../../../config/env.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { GeminiProvider } from "./gemini.provider.js";
import { GroqProvider } from "./groq.provider.js";

export function createAIProvider(
  providerType: "gemini" | "groq" = env.AI_PROVIDER,
): AIProvider {
  if (providerType === "groq") {
    return new GroqProvider();
  }
  return new GeminiProvider();
}

