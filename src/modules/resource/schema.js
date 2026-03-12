import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createResourceSchema = z
  .object({
    course: objectID,
    type: z.enum(["note", "assignment"]),
    title: z.string().min(1),
    description: z.string().optional(),
    deadline: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "assignment") return !!data.deadline;
      return true;
    },
    {
      message: "Deadline is required for assignments",
      path: ["deadline"],
    },
  );

export const editResourceSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    deadline: z.coerce.date().optional(),
  })
  .partial();

export const resourceQuerySchema = z.object({
  type: z.enum(["note", "assignment"]).optional(),
});

export const resourceParamsSchema = z.object({
  id: objectID,
});
