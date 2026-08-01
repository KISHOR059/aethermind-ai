import type { ContextProvider } from "./context-provider.interface.js";
import {
  createContextProviderRegistry,
  type ContextProviderRegistry,
} from "./context-registry.js";
import type { DailyPlannerContext } from "./context.types.js";

export class ContextBuilder {
  public constructor(
    private readonly registry: ContextProviderRegistry =
      createContextProviderRegistry(),
  ) {}

  public async buildDailyPlannerContext(
    userId: string,
  ): Promise<DailyPlannerContext> {
    const providers = Object.entries(this.registry) as [
      keyof ContextProviderRegistry,
      ContextProvider<unknown>,
    ][];

    const entries = await Promise.all(
      providers.map(async ([key, provider]) => [
        key,
        await provider.build(userId),
      ] as const),
    );

    return Object.fromEntries(entries) as DailyPlannerContext;
  }
}

const defaultContextBuilder = new ContextBuilder();

export const buildDailyPlannerContext = (
  userId: string,
): Promise<DailyPlannerContext> =>
  defaultContextBuilder.buildDailyPlannerContext(userId);
