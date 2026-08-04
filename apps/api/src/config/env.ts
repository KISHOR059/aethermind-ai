import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  AI_PROVIDER: z.string().trim().min(1).default("gemini"),
  GEMINI_API_KEY: z.string().trim().default(""),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-pro"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().trim().min(1).default("llama3.2:3b"),
  OLLAMA_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(300_000).default(180_000),
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
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
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

export type Environment = z.infer<typeof envSchema>;
