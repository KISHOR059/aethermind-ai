export type AIParseErrorCode =
  | "INVALID_JSON"
  | "SCHEMA_VALIDATION_FAILED"
  | "EMPTY_REPLY";

export type AIParseIssue = {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code?: string;
};

export class AIParseError extends Error {
  public readonly code: AIParseErrorCode;
  public readonly issues: readonly AIParseIssue[];

  public constructor(
    message: string,
    code: AIParseErrorCode,
    issues: readonly AIParseIssue[] = [],
  ) {
    super(message);
    this.name = "AIParseError";
    this.code = code;
    this.issues = issues;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
