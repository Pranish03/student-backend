import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createSubmissionSchema = z.object({
  assignment: objectID,
  file: z.url(),
});

export const editSubmissionSchema = z.object({
  file: z.url(),
});

export const submissionParamsSchema = z.object({
  id: objectID,
});
