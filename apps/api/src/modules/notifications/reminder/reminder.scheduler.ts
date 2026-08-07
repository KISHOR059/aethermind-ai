import { runAllReminderChecks } from "./reminder.engine.js";
import { logger } from "../../../lib/logger.js";

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

export type ReminderSchedulerConfig = {
  intervalMs?: number;
  enabled?: boolean;
};

export class ReminderScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly enabled: boolean;

  constructor(config: ReminderSchedulerConfig = {}) {
    this.intervalMs = config.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.enabled = config.enabled ?? true;
  }

  start(): void {
    if (!this.enabled) {
      logger.info("Reminder scheduler disabled");
      return;
    }

    if (this.intervalId) {
      logger.warn("Reminder scheduler already running");
      return;
    }

    logger.info("Starting reminder scheduler", {
      intervalMs: this.intervalMs,
      intervalMinutes: Math.round(this.intervalMs / ONE_MINUTE_MS),
    });

    this.intervalId = setInterval(() => {
      void this.run();
    }, this.intervalMs);

    if (this.intervalId && typeof this.intervalId.unref === "function") {
      this.intervalId.unref();
    }

    logger.info("Reminder scheduler started");
  }

  stop(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    logger.info("Reminder scheduler stopped");
  }

  async runOnce(): Promise<void> {
    await runAllReminderChecks();
  }

  private async run(): Promise<void> {
    try {
      await runAllReminderChecks();
    } catch (error) {
      logger.error("Reminder scheduler execution failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  get isRunning(): boolean {
    return this.intervalId !== null;
  }
}
