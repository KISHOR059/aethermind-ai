import { describe, expect, it } from "vitest";
import { createAIProvider } from "./provider.factory.js";
import { GeminiProvider } from "./gemini.provider.js";

describe("createAIProvider", () => {
  it("returns GeminiProvider as the sole AI provider", () => {
    const provider = createAIProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.modelInformation.provider).toBe("Gemini");
    expect(provider.modelInformation.model).toBe("gemini-3.5-flash");
  });

  it("provides an AIProvider-compliant instance with generateText method", () => {
    const provider = createAIProvider();
    expect(typeof provider.generateText).toBe("function");
    expect(typeof provider.healthCheck).toBe("function");
    expect(provider.modelInformation).toBeDefined();
    expect(provider.status).toBeDefined();
  });
});

