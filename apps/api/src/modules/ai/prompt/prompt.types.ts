export type PromptRole = "system" | "user" | "assistant";

export type PromptFragment = {
  readonly role: PromptRole;
  readonly content: string;
};

export type PromptMetadata = {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly description: string;
};

export type BuiltPrompt = PromptMetadata & {
  readonly fragments: readonly PromptFragment[];
};

export type PromptTemplate<TVariables extends object> = (
  variables: TVariables,
) => readonly PromptFragment[];

export type PromptDefinition<TVariables extends object> = PromptMetadata & {
  readonly template: PromptTemplate<TVariables>;
};
