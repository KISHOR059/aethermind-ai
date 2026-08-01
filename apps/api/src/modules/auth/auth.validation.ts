import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(80);

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  avatar: z.string().trim().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
