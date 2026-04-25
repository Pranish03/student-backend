import { z } from "zod";

const objectID = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
  .nullable()
  .optional();

// Base course schema
const baseCourseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().min(1, "Code is required"),
  teacher: objectID,
});

// Create course validation schema
export const createCourseSchema = baseCourseSchema.strict();

// Update course validation schema
export const updateCourseSchema = baseCourseSchema
  .omit({ teacher: true })
  .partial()
  .strict();

// Update course teacher validation schema
export const updateCourseTeacherSchema = z.object({
  teacher: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
});

// Get course by id validation schema
export const courseIdSchema = z.object({
  id: objectID,
});

// FIX: Query schema for GET /courses — supports optional ?teacher=<id>
// filter so teachers only fetch their own courses instead of all courses.
export const courseQuerySchema = z.object({
  teacher: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
    .optional(),
});
