import { z } from "zod";

// User login validation schema
export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must have at least 8 characters"),
});

// Forgot password validation schema
export const forgotPasswordSchema = loginSchema
  .omit({ password: true })
  .strict();

// Reset token validation schema
export const resetTokenSchema = z.object({
  token: z
    .string()
    .length(40, "Invalid token length")
    .regex(/^[0-9a-fA-F]+$/, "Token must be hex"),
});

// Reset password validation schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string("Password is required")
      .min(8, "Password must have at least 8 characters"),
    confirm: z
      .string("Confirm password is required")
      .min(8, "confirm password must have at least 8 characters"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Password do not match",
    path: ["confirm"],
  });

// Reset password validation schema
export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string("Current password is required")
      .min(8, "Current password must have at least 8 characters"),
    newPassword: z
      .string("Password is required")
      .min(8, "Password must have at least 8 characters"),
    confirmNew: z
      .string("Confirm password is required")
      .min(8, "confirm password must have at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNew, {
    message: "Password do not match",
    path: ["confirmNew"],
  });
