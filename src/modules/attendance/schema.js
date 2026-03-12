import { z } from "zod";

export const objectID = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const attendance = z.object({
  student: objectID,
  isPresent: z.boolean().default(false),
});

export const createAttendanceSchema = z.object({
  course: objectID,
  date: z.date(),
  attendance: z.array(attendance),
});

export const editAttendanceSchema = z
  .object({
    attendance: z.array(attendance),
  })
  .partial();

export const idParamSchema = z.object({
  id: objectID,
});

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
});
