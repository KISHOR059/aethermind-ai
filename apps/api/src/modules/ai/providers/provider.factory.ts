import { env } from "../../../config/env.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { FallbackProvider } from "./fallback.provider.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OllamaProvider } from "./ollama.provider.js";

export function createAIProvider(
  primaryProviderName = env.AI_PROVIDER,
  fallbackProviderName = env.AI_FALLBACK_PROVIDER,
): AIProvider {
  const primary = instantiateProvider(primaryProviderName);

  const normalizedFallback = fallbackProviderName?.trim().toLowerCase();
  if (
    !normalizedFallback ||
    normalizedFallback === "none" ||
    normalizedFallback === primaryProviderName.trim().toLowerCase()
  ) {
    return primary;
  }

  const fallback = instantiateProvider(normalizedFallback);
  return new FallbackProvider(primary, fallback);
}

function instantiateProvider(name: string): AIProvider {
  switch (name.trim().toLowerCase()) {
    case "gemini":
      return new GeminiProvider();
    case "ollama":
      return new OllamaProvider();
    default:
      throw new Error(`Unsupported AI provider: ${name}`);
  }
}
