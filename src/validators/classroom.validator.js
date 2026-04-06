import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(4, "Classroom name must be at least 4 characters"),
  description: z.string().trim().max(512).optional(),
});

export const updateClassroomSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(4, "Classroom name must be at least 4 characters")
      .optional(),
    description: z.string().trim().max(512).optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Provide at least one field to update",
  });

export const joinClassroomParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z2-9]{8}$/,
      "Classroom code must be 8 characters with uppercase letters and numbers",
    ),
});
