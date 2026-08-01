import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(`AetherMind API listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  logger.error("API server failed to start", { error: error.message });
  process.exitCode = 1;
});

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}; shutting down gracefully`);

  server.close((error) => {
    if (error) {
      logger.error("API server failed during shutdown", { error: error.message });
      process.exitCode = 1;
      return;
    }

    logger.info("API server shut down");
  });
}

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
