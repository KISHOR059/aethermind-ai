import { z } from "zod";

import { parseJson } from "./json-parser.js";
import { validateSchema } from "./schema-validator.js";

export class ResponseParser {
  public parse<T>(rawResponse: string, schema: z.ZodType<T>): T {
    const parsedResponse = parseJson<unknown>(rawResponse);

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
