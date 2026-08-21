import { GoogleGenAI } from "@google/genai";

export type GeminiClientEntry = {
  readonly client: GoogleGenAI;
  readonly slot: number;
};

export class GeminiKeyPool {
  private readonly entries: GeminiClientEntry[];

  public constructor(rawKeys: (string | undefined)[]) {
    const validKeys: string[] = [];
    for (const key of rawKeys) {
      if (typeof key === "string") {
        const trimmed = key.trim();
        if (trimmed.length > 0) {
          validKeys.push(trimmed);
        }
      }
    }

    this.entries = validKeys.map((key, index) => ({
      client: new GoogleGenAI({ apiKey: key }),
      slot: index + 1,
    }));
  }

  public get size(): number {
    return this.entries.length;
  }

  public get isConfigured(): boolean {
    return this.entries.length > 0;
  }

  public getClients(): readonly GeminiClientEntry[] {
    return this.entries;
  }

  public getPrimaryClient(): GoogleGenAI | null {
    return this.entries[0]?.client ?? null;
  }
}
