import { z } from "zod";

export const assistantChatResponseSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(10, "Assistant reply must contain meaningful text"),
  suggestedActions: z.array(z.string()).default([]),
});

export type AssistantChatResponse = z.infer<typeof assistantChatResponseSchema>;
