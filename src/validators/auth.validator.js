import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().min(5).trim(),
  password: z.string().trim().min(8).max(32),
});

export const resgisterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(8, "Email must be at least 8 characters long")
    .regex(/^\S+@\S+\.\S+$/, "Please use a valid email address"),

  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),

  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters"),

  middleName: z.string().trim().optional(),

  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
});
