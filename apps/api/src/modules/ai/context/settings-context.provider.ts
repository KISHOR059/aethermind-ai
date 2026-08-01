import type { ContextProvider } from "./context-provider.interface.js";
import type { SettingsContext } from "./context.types.js";

export type SettingsResolver = (
  userId: string,
) => Promise<SettingsContext>;

const defaultSettingsResolver: SettingsResolver = async (userId) => {
  void userId;

  return {
    locale: "en-US",
    timeZone: "UTC",
    weekStartsOn: "monday",
  };
};

export class SettingsContextProvider
  implements ContextProvider<SettingsContext>
{
  public constructor(
    private readonly resolveSettings: SettingsResolver = defaultSettingsResolver,
  ) {}

  public async build(userId: string): Promise<SettingsContext> {
    return this.resolveSettings(userId);
  }
}
