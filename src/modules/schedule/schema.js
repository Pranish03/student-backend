import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeTableEntrySchema = z
  .object({
    course: objectIdSchema,
    day: z.enum(daysOfWeek),
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    room: z.string().optional().default("TBD"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Start time must be before end time",
    path: ["startTime"],
  });

export const createScheduleSchema = z.object({
  class: objectIdSchema,
  timeTable: z.array(timeTableEntrySchema).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const scheduleIdSchema = z.object({
  id: objectIdSchema,
});

export const scheduleByClassSchema = z.object({
  classId: objectIdSchema,
});

export const entryIdSchema = z.object({
  id: objectIdSchema,
  entryId: objectIdSchema,
});
