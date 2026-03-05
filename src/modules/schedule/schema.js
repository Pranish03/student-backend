import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const dayEnum = z.enum([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
]);

export const createScheduleSchema = z
  .object({
    class: objectID,
    course: objectID,
    day: dayEnum,
    start_time: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
    end_time: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
    room: z.string().optional().default("TBD"),
    teacher: objectID.optional(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const updateScheduleSchema = createScheduleSchema.partial().strict();

export const scheduleIdSchema = z.object({
  id: objectID,
});

export const classSchedulesSchema = z.object({
  classId: objectID,
});

export const bulkCreateSchedulesSchema = z.object({
  schedules: z
    .array(createScheduleSchema)
    .min(1, "At least one schedule is required"),
});

export const checkAvailabilitySchema = z.object({
  class: objectID,
  day: dayEnum,
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
  excludeScheduleId: objectID.optional(),
});
