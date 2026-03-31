import { z } from "zod";

export const objectID = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createResourceSchema = z.object({
  course: objectID,
  type: z.enum(["note", "assignment"]),
  title: z.string(),
  description: z.string().optional(),
  file: z.string().optional(),
  deadline: z.coerce.date().optional(),
});

export const editResourceSchema = z
  .object({
    course: objectID,
    type: z.enum(["note", "assignment"]),
    title: z.string(),
    description: z.string(),
    file: z.string(),
    deadline: z.coerce.date(),
  })
  .partial();

export const resourceParamsSchema = z.object({
  id: objectID,
});

export const resourceQuerySchema = z.object({
  course: objectID.optional(),
  type: z.enum(["note", "assignment"]).optional(),
});
