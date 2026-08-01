export function renderPromptText(
  template: string,
  variables: object,
): string {
  return template.replace(
    /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g,
    (_match, variableName: string) => {
      const value = (variables as Record<string, unknown>)[variableName];

      if (typeof value !== "string") {
        throw new Error(`Missing prompt variable: ${variableName}`);
      }

      return value;
    },
  );
}
