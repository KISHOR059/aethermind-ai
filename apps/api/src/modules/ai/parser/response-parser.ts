import { z } from "zod";

import { parseJson } from "./json-parser.js";
import { validateSchema } from "./schema-validator.js";
import { AIParseError } from "./response.types.js";

export class ResponseParser {
  public parse<T>(rawResponse: string, schema: z.ZodType<T>): T {
    const parsedResponse = parseJson<unknown>(rawResponse);

    if (
      typeof parsedResponse === "object" &&
      parsedResponse !== null &&
      "reply" in parsedResponse &&
      typeof (parsedResponse as { reply: unknown }).reply === "string" &&
      (parsedResponse as { reply: string }).reply.trim().length === 0
    ) {
      throw new AIParseError(
        "Assistant returned an empty reply.",
        "EMPTY_REPLY",
        [
          {
            path: ["reply"],
            message: "Assistant returned an empty reply.",
            code: "EMPTY_REPLY",
          },
        ],
      );
    }

    return validateSchema(parsedResponse, schema);
  }
}

const defaultResponseParser = new ResponseParser();

export function parseResponse<T>(
  rawResponse: string,
  schema: z.ZodType<T>,
): T {
  return defaultResponseParser.parse(rawResponse, schema);
}
