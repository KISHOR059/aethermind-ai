import { Groq } from "groq-sdk";

export type GroqClientEntry = {
  readonly client: Groq;
  readonly slot: number;
};

export class GroqKeyPool {
  private readonly entries: GroqClientEntry[];

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
      client: new Groq({ apiKey: key }),
      slot: index + 1,
    }));
  }

  public get size(): number {
    return this.entries.length;
  }

  public get isConfigured(): boolean {
    return this.entries.length > 0;
  }

  public getClients(): readonly GroqClientEntry[] {
    return this.entries;
  }

  public getPrimaryClient(): Groq | null {
    return this.entries[0]?.client ?? null;
  }
}
