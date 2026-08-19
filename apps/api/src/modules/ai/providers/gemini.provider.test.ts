import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@google/genai";
import { GeminiProvider } from "./gemini.provider.js";
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIRateLimitError,
} from "../../../utils/app-error.js";

// Mock @google/genai
const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  class MockGoogleGenAI {
    public models = {
      generateContent: mockGenerateContent,
    };
  }

  class MockApiError extends Error {
    public status: number;
    public constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    ApiError: MockApiError,
  };
});

describe("GeminiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 503 when initialized without an API key", async () => {
    const provider = new GeminiProvider("", "gemini-3.5-flash", 1000);
    expect(provider.status).toBe("not_configured");

    await expect(
      provider.generateText({ input: "Hello" }),
    ).rejects.toThrow(AIProviderError);
  });

  it("generates structured text successfully using gemini-3.5-flash and thinking level", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"status": "ok", "score": 95}',
      candidates: [{ finishReason: "STOP" }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
      modelVersion: "gemini-3.5-flash",
    });

    const provider = new GeminiProvider(
      "test-api-key",
      "gemini-3.5-flash",
      5000,
    );
    const response = await provider.generateText({
      input: "Generate plan",
      temperature: 0.2,
      maxOutputTokens: 1000,
      thinkingLevel: "medium",
    });

    expect(response.text).toBe('{"status": "ok", "score": 95}');
    expect(response.finishReason).toBe("STOP");
    expect(response.usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    });
    expect(response.model.provider).toBe("Gemini");
    expect(response.model.model).toBe("gemini-3.5-flash");
    expect(provider.status).toBe("healthy");

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash",
        config: expect.objectContaining({
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 1024 },
        }),
      }),
    );
  });

  it("throws AIProviderError when model returns empty text", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "   ",
      candidates: [{ finishReason: "STOP" }],
    });

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    await expect(
      provider.generateText({ input: "Generate plan" }),
    ).rejects.toThrow("The AI provider returned an empty response");
  });

  it("maps HTTP 404 to AIProviderError with 404 status and does not retry", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError("Model models/gemini-2.5-flash is no longer available", 404),
    );

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    await expect(
      provider.generateText({ input: "Generate plan" }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining("HTTP 404"),
    });

    // 404 is a configuration error and should NOT be retried
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("maps HTTP 429 to AIRateLimitError and retries transiently", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError("Resource has been exhausted", 429),
    );

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    await expect(
      provider.generateText({ input: "Generate plan" }),
    ).rejects.toThrow(AIRateLimitError);

    // Should attempt retries for transient 429 (initial + 2 retries = 3)
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it("maps HTTP 401 to AIProviderError with 401 status and does not retry", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError("API_KEY_INVALID", 401),
    );

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    await expect(
      provider.generateText({ input: "Generate plan" }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Gemini authentication failed. Please verify GEMINI_API_KEY.",
    });

    // 401 is auth error, should NOT be retried
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("maps HTTP 504 to AIProviderTimeoutError", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError("Deadline exceeded", 504),
    );

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    await expect(
      provider.generateText({ input: "Generate plan" }),
    ).rejects.toThrow(AIProviderTimeoutError);
  });

  it("retries transient failures and recovers", async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new ApiError("Service temporarily unavailable", 503))
      .mockResolvedValueOnce({
        text: '{"result": "success"}',
        candidates: [{ finishReason: "STOP" }],
      });

    const provider = new GeminiProvider("test-api-key", "gemini-3.5-flash", 5000);
    const response = await provider.generateText({ input: "Generate plan" });

    expect(response.text).toBe('{"result": "success"}');
    expect(response.retryCount).toBe(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("performs health check correctly", async () => {
    const unconfigured = new GeminiProvider("", "gemini-3.5-flash");
    const unconfiguredHealth = await unconfigured.healthCheck();
    expect(unconfiguredHealth.isAvailable).toBe(false);
    expect(unconfiguredHealth.status).toBe("not_configured");

    const configured = new GeminiProvider("test-api-key", "gemini-3.5-flash");
    const configuredHealth = await configured.healthCheck();
    expect(configuredHealth.isAvailable).toBe(true);
    expect(configuredHealth.status).toBe("healthy");
  });
});
