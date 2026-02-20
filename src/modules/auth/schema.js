import { z } from "zod";

// User login validation schema
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must have at least 8 characters"),
});
