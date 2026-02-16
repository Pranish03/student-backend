import * as z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address").min(1, "Email is required"),

  password: z
    .string()
    .trim()
    .min(8, "Password must have atleast 8 characters."),
});
