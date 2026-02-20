import { z } from "zod";

// Base user schema
const baseUserSchema = z.object({
  name: z
    .string("Name is required")
    .min(3, "Name must have at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must have at least 8 characters"),
  role: z.enum(["student", "teacher", "admin"]).optional(),
  isActive: z.boolean().default(true),
});

// Create user validation schema
export const createUserSchema = baseUserSchema
  .omit({ password: true, isActive: true })
  .strict();

// Update user validation schema
export const updateUserSchema = baseUserSchema
  .omit({ password: true })
  .partial()
  .strict();

// Get users by role validation schema
export const userQuerySchema = z.object({
  role: z.enum(["student", "teacher", "admin"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Get user by id validation schema
export const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
});
