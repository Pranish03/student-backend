import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string("Name is required").trim(),
  code: z.string("Code is required").trim(),
  teacher: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
});
