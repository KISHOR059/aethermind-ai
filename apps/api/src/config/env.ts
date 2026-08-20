import "dotenv/config";

import { z } from "zod";

import { isDurationString } from "../utils/duration.js";

const durationString = z
  .string()
  .trim()
  .refine(isDurationString, {
    message: "must be a duration string such as 30s, 15m, 24h or 7d",
  });

const positiveNumber = z.coerce.number().int().min(1);

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  AI_PROVIDER: z.enum(["gemini"]).default("gemini"),
  GEMINI_API_KEY: z.string().trim().default(""),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.5-flash"),
  AI_THINKING_LEVEL: z
    .enum(["none", "low", "medium", "high"])
    .default("medium"),
  AI_GEMINI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(120_000)
    .default(30_000),
  AI_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(120_000)
    .default(30_000),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI must not be empty")
    .default("mongodb://127.0.0.1:27017/aethermind"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters")
    .default("aethermind-development-access-secret-change-me"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters")
    .default("aethermind-development-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRES_IN: durationString.default("15m"),
  JWT_REFRESH_EXPIRES_IN: durationString.default("7d"),
  SESSION_INACTIVITY_TIMEOUT_MS: positiveNumber.default(86_400_000),
  SESSION_MAX_LIFETIME_MS: positiveNumber.default(604_800_000),
  SESSION_WARNING_MS: positiveNumber.default(300_000),
  WHISPER_MODEL: z.string().trim().default("base"),
  WHISPER_PATH: z.string().trim().default("whisper"),
  PIPER_MODEL: z.string().trim().default("en_US-lessac-medium"),
  PIPER_PATH: z.string().trim().default("piper"),
  VOICE_ENABLED: z.coerce.boolean().default(true),
  VOICE_STREAMING_ENABLED: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

if (
  env.NODE_ENV === "production" &&
  (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production",
  );
}

if (env.NODE_ENV === "production" && !env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required in production");
}

if (env.SESSION_WARNING_MS >= env.SESSION_INACTIVITY_TIMEOUT_MS) {
  throw new Error(
    "SESSION_WARNING_MS must be smaller than SESSION_INACTIVITY_TIMEOUT_MS",
  );
}

export type Environment = z.infer<typeof envSchema>;
