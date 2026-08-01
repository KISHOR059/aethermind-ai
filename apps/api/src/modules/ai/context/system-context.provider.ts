import { env } from "../../../config/env.js";
import type { ContextProvider } from "./context-provider.interface.js";
import type { SystemContext } from "./context.types.js";

export class SystemContextProvider implements ContextProvider<SystemContext> {
  public async build(userId: string): Promise<SystemContext> {
    void userId;
    return {
      application: "AetherMind",
      environment: env.NODE_ENV,
      version: "1.0.0",
    };
  }
}
