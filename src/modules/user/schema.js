import { z } from "zod";

/**
 * @Description Create user validation schema
 */
export const createUserSchema = z.object({
  name: z
    .string("Name is required")
    .min(3, "Name must have at least 3 characters"),
  email: z.email("Invalid email address"),
  role: z.enum(["student", "teacher", "admin"]).optional(),
});

/**
 * @Description Get users by role validation schema
 */
export const userQuerySchema = z.object({
  role: z.enum(["student", "teacher", "admin"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * @Description Get user by id validation schema
 */
export const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
});

/**
 * @DESC User login validation schema
 */
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must have at least 8 characters"),
});
