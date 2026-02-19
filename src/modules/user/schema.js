import { z } from "zod";

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
