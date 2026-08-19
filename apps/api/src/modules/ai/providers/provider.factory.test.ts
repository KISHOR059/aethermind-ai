import { describe, expect, it } from "vitest";
import { createAIProvider } from "./provider.factory.js";
import { FallbackProvider } from "./fallback.provider.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OllamaProvider } from "./ollama.provider.js";

describe("createAIProvider", () => {
  it("creates FallbackProvider when primary and fallback are distinct", () => {
    const provider = createAIProvider("gemini", "ollama");
    expect(provider).toBeInstanceOf(FallbackProvider);
    expect(provider.modelInformation.provider).toBe("Gemini");
  });

  it("creates GeminiProvider directly when fallback is 'none'", () => {
    const provider = createAIProvider("gemini", "none");
    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.modelInformation.provider).toBe("Gemini");
  });

  it("creates OllamaProvider directly when fallback is 'none'", () => {
    const provider = createAIProvider("ollama", "none");
    expect(provider).toBeInstanceOf(OllamaProvider);
    expect(provider.modelInformation.provider).toBe("Ollama");
  });

  it("creates standalone provider when primary and fallback are identical", () => {
    const provider = createAIProvider("gemini", "gemini");
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it("throws error for unsupported provider", () => {
    expect(() => createAIProvider("unsupported-llm", "none")).toThrow(
      "Unsupported AI provider: unsupported-llm",
    );
  });
});
