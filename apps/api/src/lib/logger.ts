import type { RequestHandler } from "express";

import { env } from "../config/env.js";

const ANSI = {
  reset: "\u001b[0m",
  blue: "\u001b[34m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  gray: "\u001b[90m",
} as const;

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const levelColors: Record<LogLevel, string> = {
  debug: ANSI.gray,
  info: ANSI.blue,
  warn: ANSI.yellow,
  error: ANSI.red,
};

function serialize(context: LogContext) {
  return JSON.stringify(context, (_key, value: unknown) =>
    value instanceof Error
      ? { name: value.name, message: value.message, stack: value.stack }
      : value,
  );
}

function prettyValue(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const timestamp = new Date().toISOString();
  const record = { timestamp, level, service: "aethermind-api", message, ...context };

  if (env.NODE_ENV === "development") {
    const details = Object.entries(context)
      .map(([key, value]) => `${key}=${prettyValue(value)}`)
      .join(" ");
    const suffix = details ? ` ${details}` : "";
    const label = level.toUpperCase().padEnd(5);
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `${ANSI.gray}${timestamp}${ANSI.reset} ${levelColors[level]}${label}${ANSI.reset} ${message}${suffix}`,
    );
    return;
  }

  process.stdout.write(`${serialize(record)}\n`);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
};

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint();

  response.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const context = {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      responseTimeMs: Number(durationMs.toFixed(2)),
      userAgent: request.get("user-agent") ?? undefined,
      ip: request.ip,
    };

    if (response.statusCode >= 500) logger.error("request.completed", context);
    else if (response.statusCode >= 400) logger.warn("request.completed", context);
    else logger.info("request.completed", context);
  });

  next();
};
