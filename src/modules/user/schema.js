import { z } from "zod";

/**
 * @DESC Create user validation schema
 */
export const createUserSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
    })
    .min(3, "Name must have at least 3 characters"),

  email: z.email({
    required_error: "Email is required",
    message: "Invalid email address",
  }),

  role: z.enum(["student", "teacher", "admin"]).optional(),
});

/**
 * @DESC Get user validation schema
 */
export const getUserSchema = z.object({
  role: z.enum(["student", "teacher", "admin"]).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * @DESC User login validation schema
 */
export const loginSchema = z.object({
  email: z.email({
    required_error: "Email is required",
    message: "Invalid email address",
  }),

  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must have at least 8 characters"),
});
