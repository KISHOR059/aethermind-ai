import type { IncomingMessage, ServerResponse } from "node:http";

import app from "./app.js";
import { connectDatabase } from "./database/mongodb.js";
import { logger } from "./lib/logger.js";

/**
 * Serverless API request handler for Vercel Functions.
 *
 * Request Lifecycle:
 * 1. Incoming HTTP request is received by Vercel Serverless Function runtime.
 * 2. connectDatabase() verifies or reuses cached Mongoose connection.
 * 3. Dispatches request to the pre-configured Express application.
 *
 * Invariants:
 * - NEVER calls app.listen()
 * - NEVER starts background intervals (setInterval)
 * - NEVER starts reminderScheduler
 * - NEVER registers process signal listeners (SIGTERM/SIGINT)
 */
export async function serverlessHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error("Serverless database connection failure", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: "Database connection failed",
      }),
    );
    return;
  }

  app(req, res);
}

export default serverlessHandler;
export { app };
