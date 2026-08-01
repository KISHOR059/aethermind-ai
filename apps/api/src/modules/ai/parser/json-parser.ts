import { AIParseError } from "./response.types.js";

export function stripMarkdownCodeFences(value: string): string {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(
    /^\x60\x60\x60(?:json)?\s*([\s\S]*?)\s*\x60\x60\x60$/i,
  );

  return fencedMatch?.[1]?.trim() ?? trimmed;
}

export function parseJson<T = unknown>(value: string): T {
  const normalized = stripMarkdownCodeFences(value);

  try {
    return JSON.parse(normalized) as T;
  } catch (error) {
    throw new AIParseError(
      "AI response is not valid JSON",
      "INVALID_JSON",
      [
        {
          path: [],
          message: error instanceof Error ? error.message : "Invalid JSON",
        },
      ],
    );
  }
}
