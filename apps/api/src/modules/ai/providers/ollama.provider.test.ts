import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { OllamaProvider } from "./ollama.provider.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
} from "../../../utils/app-error.js";

describe("OllamaProvider", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("throws 503 when not configured", async () => {
    const provider = new OllamaProvider("", "");
    expect(provider.status).toBe("not_configured");

    await expect(
      provider.generateText({ input: "Hello" }),
    ).rejects.toThrow(AIProviderError);
  });

  it("generates structured text successfully", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: "llama3.2:3b",
        response: '```json\n{"status": "ok", "score": 90}\n```',
        done_reason: "stop",
        prompt_eval_count: 80,
        eval_count: 40,
      }),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    const response = await provider.generateText({ input: "Plan my day" });

    expect(response.text).toBe('{"status": "ok", "score": 90}');
    expect(response.finishReason).toBe("STOP");
    expect(response.usage).toEqual({
      inputTokens: 80,
      outputTokens: 40,
      totalTokens: 120,
    });
    expect(response.model.provider).toBe("Ollama");
    expect(response.model.model).toBe("llama3.2:3b");
    expect(provider.status).toBe("healthy");
  });

  it("handles empty response from Ollama", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: "llama3.2:3b",
        response: "   ",
      }),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    await expect(
      provider.generateText({ input: "Plan my day" }),
    ).rejects.toThrow("Ollama returned an empty response");
  });

  it("maps HTTP 429 to AIRateLimitError", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "Too many requests" }),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    await expect(
      provider.generateText({ input: "Plan my day" }),
    ).rejects.toThrow(AIRateLimitError);
  });

  it("maps connection refused to AIProviderError with 503", async () => {
    const mockFetch = vi.fn().mockRejectedValue(
      new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }),
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    await expect(
      provider.generateText({ input: "Plan my day" }),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: "Ollama is unavailable. Start Ollama and verify OLLAMA_BASE_URL.",
    });
    expect(provider.status).toBe("offline");
  });

  it("maps abort error to AIProviderTimeoutError", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    const mockFetch = vi.fn().mockRejectedValue(abortError);
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    await expect(
      provider.generateText({ input: "Plan my day" }),
    ).rejects.toThrow(AIProviderTimeoutError);
    expect(provider.status).toBe("offline");
  });

  it("performs health check correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const provider = new OllamaProvider(
      "http://localhost:11434",
      "llama3.2:3b",
      5000,
    );
    const health = await provider.healthCheck();
    expect(health.isAvailable).toBe(true);
    expect(health.status).toBe("healthy");
  });
});
