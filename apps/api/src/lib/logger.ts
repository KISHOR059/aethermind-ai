import morgan from "morgan";
import type { Request } from "express";

import { env } from "../config/env.js";

const ANSI = {
  reset: "\u001b[0m",
  blue: "\u001b[34m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
} as const;

type LogContext = Record<string, unknown>;

function formatMessage(level: string, message: string, context?: LogContext) {
  const details = context ? ` ${JSON.stringify(context)}` : "";
  return `[${level}] ${message}${details}`;
}

function writeLog(
  level: string,
  message: string,
  context: LogContext | undefined,
  color: string,
  write: (value: string) => void,
) {
  const output = formatMessage(level, message, context);

  write(env.NODE_ENV === "development" ? `${color}${output}${ANSI.reset}` : output);
}

export const logger = {
  info(message: string, context?: LogContext) {
    writeLog("INFO", message, context, ANSI.blue, console.log);
  },
  warn(message: string, context?: LogContext) {
    writeLog("WARN", message, context, ANSI.yellow, console.warn);
  },
  error(message: string, context?: LogContext) {
    writeLog("ERROR", message, context, ANSI.red, console.error);
  },
};

morgan.token("request-id", (request) => (request as Request).requestId ?? "unknown");

export const requestLogger = morgan(
  ":request-id :method :status :response-time ms",
  {
    stream: {
      write(message) {
        logger.info(message.trim());
      },
    },
  },
);
