import type { ContextProvider } from "./context-provider.interface.js";
import type { TimeContext } from "./context.types.js";

export class TimeContextProvider implements ContextProvider<TimeContext> {
  public async build(userId: string): Promise<TimeContext> {
    void userId;
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
    });

    return {
      now,
      date: now.toISOString().slice(0, 10),
      timeZone,
      dayOfWeek: formatter.format(now),
    };
  }
}
