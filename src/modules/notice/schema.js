import { z } from "zod";

export const objectID = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional(),
  targetRole: z.enum(["all", "student", "teacher"]).default("all"),
  course: objectID.optional().nullable(),
});

export const updateNoticeSchema = createNoticeSchema.partial();

export const noticeIdSchema = z.object({
  id: objectID,
});

export const noticeQuerySchema = z.object({
  targetRole: z.enum(["all", "student", "teacher"]).optional(),
  course: objectID.optional(),
});
