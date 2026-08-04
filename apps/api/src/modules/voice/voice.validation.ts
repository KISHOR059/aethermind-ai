import { z } from "zod";

export const speakRequestSchema = z.object({
  text: z.string().trim().min(1, "Text to synthesize cannot be empty"),
  voice: z.string().optional(),
  rate: z.coerce.number().min(0.25).max(3.0).optional().default(1.0),
  pitch: z.coerce.number().min(0.5).max(2.0).optional().default(1.0),
});

export type SpeakInput = z.infer<typeof speakRequestSchema>;

export const transcribeQuerySchema = z.object({
  model: z.enum(["tiny", "base", "small", "medium", "large"]).optional().default("base"),
  language: z.string().optional().default("en"),
});

export type TranscribeQueryInput = z.infer<typeof transcribeQuerySchema>;
