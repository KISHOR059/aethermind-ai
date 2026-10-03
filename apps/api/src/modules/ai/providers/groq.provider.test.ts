import { describe, expect, it, vi, beforeEach } from "vitest";
import { GroqProvider } from "./groq.provider.js";
import {
  AIProviderError,
  AIRateLimitError,
} from "../../../utils/app-error.js";

// Mock groq-sdk
const mockCreateChatCompletion = vi.fn();
const mockListModels = vi.fn();

vi.mock("groq-sdk", () => {
  class MockGroq {
    public chat = {
      completions: {
        create: mockCreateChatCompletion,
      },
    };
    public models = {
      list: mockListModels,
    };
  }

  class MockAPIError extends Error {
    public status: number;
    public constructor(message: string, status: number) {
      super(message);
      this.name = "APIError";
      this.status = status;
    }
  }

  return {
    Groq: MockGroq,
    APIError: MockAPIError,
  };
});

describe("GroqProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 503 when initialized without an API key", async () => {
    const provider = new GroqProvider("", "llama-3.3-70b-versatile", 1000);
    expect(provider.status).toBe("not_configured");

    await expect(
      provider.generateText({ input: "Hello" }),
    ).rejects.toThrow(AIProviderError);
  });

  it("generates structured text successfully", async () => {
    mockCreateChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: "stop",
          message: { content: '{"status": "ok", "message": "success"}' },
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 30,
        total_tokens: 80,
      },
    });

    const provider = new GroqProvider(
      "test-groq-key",
      "llama-3.3-70b-versatile",
      5000,
    );
    expect(provider.status).toBe("configured");

    const result = await provider.generateText({
      input: "Generate plan in JSON",
      responseMimeType: "application/json",
    });

    expect(result.text).toBe('{"status": "ok", "message": "success"}');
    expect(result.finishReason).toBe("STOP");
    expect(result.usage?.totalTokens).toBe(80);
    expect(result.model.provider).toBe("Groq");
    expect(provider.status).toBe("healthy");
  });

  it("fails over to slot 2 when slot 1 hits 429 rate limit", async () => {
    const { APIError } = await import("groq-sdk");

    // Slot 1 fails with 429
    mockCreateChatCompletion.mockRejectedValueOnce(
      new APIError("Rate limit exceeded", 429),
    );

    // Slot 2 succeeds
    mockCreateChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          finish_reason: "stop",
          message: { content: '{"from": "slot 2"}' },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    });

    const provider = new GroqProvider(
      ["key-slot-1", "key-slot-2"],
      "llama-3.3-70b-versatile",
      5000,
    );

    const result = await provider.generateText({ input: "Hello" });

    expect(result.text).toBe('{"from": "slot 2"}');
    expect(mockCreateChatCompletion).toHaveBeenCalledTimes(2);
  });

  it("healthCheck reports healthy when API responds", async () => {
    mockListModels.mockResolvedValueOnce({ data: [] });

    const provider = new GroqProvider(
      "test-key",
      "llama-3.3-70b-versatile",
      2000,
    );
    const health = await provider.healthCheck();

    expect(health.isAvailable).toBe(true);
    expect(health.status).toBe("healthy");
    expect(health.provider).toBe("Groq");
  });
});
