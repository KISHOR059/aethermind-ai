import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/mongodb.js";
import { logger } from "./lib/logger.js";
import { ReminderScheduler } from "./modules/notifications/reminder/index.js";
import type { Server } from "node:http";

const reminderScheduler = new ReminderScheduler({
  intervalMs: 60 * 60 * 1000,
  enabled: true,
});

async function bootstrap(): Promise<Server> {
  try {
    await connectDatabase();
    logger.info("MongoDB connection established");
  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    process.exit(1);
  }

  reminderScheduler.start();

  const server = app.listen(env.PORT, () => {
    logger.info(`AetherMind API listening on port ${env.PORT}`);
  });

  server.on("error", (error) => {
    logger.error("API server failed to start", { error: error.message });
    process.exitCode = 1;
  });

  return server;
}

const server = await bootstrap();

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}; shutting down gracefully`);

  reminderScheduler.stop();

  server.close((error) => {
    if (error) {
      logger.error("API server failed during shutdown", { error: error.message });
      process.exitCode = 1;
      return;
    }

    void disconnectDatabase()
      .then(() => logger.info("API server shut down"))
      .catch((shutdownError: unknown) => {
        logger.error("MongoDB disconnection failed", {
          error: shutdownError instanceof Error ? shutdownError.message : "Unknown database error",
        });
        process.exitCode = 1;
      });
  });
}

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
