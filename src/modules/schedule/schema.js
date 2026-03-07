import { z } from "zod";

export const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeTableEntry = z.object({
  course: objectID,
  day: z.enum([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  room: z.string().optional(),
});

export const createScheduleSchema = z.object({
  class: objectID,
  timeTable: z.array(timeTableEntry).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const addTimeTableEntrySchema = timeTableEntry;

export const updateTimeTableEntrySchema = timeTableEntry.partial();

export const scheduleIdSchema = z.object({
  id: objectID,
});

export const scheduleByClassSchema = z.object({
  classId: objectID,
});

export const timeTableParamsSchema = z.object({
  id: objectID,
  entryId: objectID,
});
