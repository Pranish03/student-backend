import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// Validation schema for creating a class
export const createClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  academicYear: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier")
    .refine(
      (year) => year >= new Date().getFullYear(),
      "Academic year cannot be in the past",
    ),
  capacity: z.number().int().min(10).max(35).default(35),
});

// Validation schema for updating a class
export const updateClassSchema = createClassSchema.partial().strict();

// Validation schema for assigning courses
export const assignCourses = z.object({
  courses: z
    .array(objectID)
    .min(1, "At least one course is required")
    .optional(),
});

// Validation schema for enrolling students
export const enrollStudents = z.object({
  students: z
    .array(objectID)
    .min(1, "At least one student is required")
    .optional(),
});

// Validation schema for removing students
export const removeStudentsSchema = z.object({
  students: z.array(objectID).min(1, "At least one student is required"),
});

// Validation schema for removing courses
export const removeCoursesSchema = z.object({
  courses: z.array(objectID).min(1, "At least one course is required"),
});

// Validation schema for class ID parameter
export const classIdSchema = z.object({
  id: objectID,
});
