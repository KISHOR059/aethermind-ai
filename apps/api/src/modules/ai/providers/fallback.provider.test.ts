import { describe, expect, it, vi } from "vitest";
import { FallbackProvider } from "./fallback.provider.js";
import type { AIProvider } from "./ai-provider.interface.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
  ValidationError,
} from "../../../utils/app-error.js";
import type { GenerateTextResponse } from "./types.js";

describe("FallbackProvider", () => {
  const sampleSuccessResponse: GenerateTextResponse = {
    text: '{"result": "success"}',
    finishReason: "STOP",
    usage: { inputTokens: 50, outputTokens: 25, totalTokens: 75 },
    model: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
  };

  const sampleFallbackResponse: GenerateTextResponse = {
    text: '{"result": "fallback_success"}',
    finishReason: "STOP",
    usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
    model: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
  };

  it("returns primary response directly when primary succeeds", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockResolvedValue(sampleSuccessResponse),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn(),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    const response = await provider.generateText({ input: "Test" });

    expect(response.text).toBe('{"result": "success"}');
    expect(response.fallbackUsed).toBe(false);
    expect(mockPrimary.generateText).toHaveBeenCalledTimes(1);
    expect(mockFallback.generateText).not.toHaveBeenCalled();
  });

  it("triggers fallback when primary fails with AIRateLimitError", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new AIRateLimitError()),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockResolvedValue(sampleFallbackResponse),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    const response = await provider.generateText({ input: "Test" });

    expect(response.text).toBe('{"result": "fallback_success"}');
    expect(response.fallbackUsed).toBe(true);
    expect(response.primaryProvider).toBe("Gemini");
    expect(response.fallbackReason).toBeDefined();
    expect(mockFallback.generateText).toHaveBeenCalledTimes(1);
  });

  it("triggers fallback when primary fails with AIProviderTimeoutError", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new AIProviderTimeoutError()),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockResolvedValue(sampleFallbackResponse),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    const response = await provider.generateText({ input: "Test" });

    expect(response.fallbackUsed).toBe(true);
    expect(response.primaryProvider).toBe("Gemini");
  });

  it("does not fallback when error is a ValidationError", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new ValidationError("Invalid input")),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn(),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    await expect(provider.generateText({ input: "Test" })).rejects.toThrow(ValidationError);
    expect(mockFallback.generateText).not.toHaveBeenCalled();
  });

  it("does not fallback on 401 authentication errors", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new AIProviderError("Invalid API key", 401)),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn(),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    await expect(provider.generateText({ input: "Test" })).rejects.toThrow("Invalid API key");
    expect(mockFallback.generateText).not.toHaveBeenCalled();
  });

  it("rethrows fallback error when both providers fail", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new AIProviderError("Gemini down", 503)),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn().mockRejectedValue(new AIProviderError("Ollama down", 503)),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    await expect(provider.generateText({ input: "Test" })).rejects.toThrow("Ollama down");
  });

  it("aggregates health check correctly", async () => {
    const mockPrimary: AIProvider = {
      modelInformation: { provider: "Gemini", model: "gemini-3.5-flash", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue({
        provider: "Gemini",
        model: "gemini-3.5-flash",
        status: "healthy",
        version: "1.0.0",
        isAvailable: true,
      }),
    };

    const mockFallback: AIProvider = {
      modelInformation: { provider: "Ollama", model: "llama3.2:3b", version: "1.0.0" },
      status: "healthy",
      generateText: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue({
        provider: "Ollama",
        model: "llama3.2:3b",
        status: "healthy",
        version: "1.0.0",
        isAvailable: true,
      }),
    };

    const provider = new FallbackProvider(mockPrimary, mockFallback);
    const health = await provider.healthCheck();

    expect(health.provider).toBe("Gemini");
    expect(health.isAvailable).toBe(true);
    expect(health.fallback).toBeDefined();
    expect(health.fallback?.provider).toBe("Ollama");
  });
});
