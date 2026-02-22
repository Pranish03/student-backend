import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// Base course schema
const baseCourseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().min(1, "Code is required"),
  teacher: objectID,
  isActive: z.boolean().default(true),
});

// Create course validation schema
export const createCourseSchema = baseCourseSchema
  .omit({ isActive: true })
  .strict();

// Update course validation schema
export const updateCourseSchema = baseCourseSchema
  .omit({ isActive: true })
  .partial()
  .strict();

// Course query validation schema
export const courseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

// Get course by id validation schema
export const courseIdSchema = z.object({
  id: objectID,
});
