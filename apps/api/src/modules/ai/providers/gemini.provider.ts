import { GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";
import type { AIProvider } from "./ai-provider.interface.js";
import type {
  GenerateTextRequest,
  GenerateTextResponse,
  StructuredGenerationRequest,
} from "./types.js";
import type { ModelInformation, ProviderStatus } from "./types.js";

export class GeminiProvider implements AIProvider {
  public readonly modelInformation: ModelInformation = {
    provider: "Gemini",
    model: env.GEMINI_MODEL,
    version: "1.0.0",
  };

  public readonly status: ProviderStatus;

  private readonly client: GoogleGenAI | null;

  public constructor() {
    this.client = env.GEMINI_API_KEY
      ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
      : null;
    this.status = this.client ? "configured" : "not_configured";
  }

  public async generateText(
    _request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    void _request;
    this.ensureConfigured();
    throw new Error("Gemini text generation is not enabled yet");
  }

  public async generateStructuredOutput<T>(
    _request: StructuredGenerationRequest<T>,
  ): Promise<T> {
    void _request;
    this.ensureConfigured();
    throw new Error("Gemini structured generation is not enabled yet");
  }

  private ensureConfigured(): asserts this is this & { client: GoogleGenAI } {
    if (!this.client) {
      throw new Error("Gemini provider is not configured");
    }
  }
}
