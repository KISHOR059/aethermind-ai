export type AiHealth = {
  provider: "Gemini";
  status: "healthy";
  version: "1.0.0";
};

export class AiService {
  public getHealth(): AiHealth {
    return {
      provider: "Gemini",
      status: "healthy",
      version: "1.0.0",
    };
  }
}
