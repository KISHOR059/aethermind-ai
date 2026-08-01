import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI must not be empty")
    .default("mongodb://127.0.0.1:27017/aethermind"),
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
