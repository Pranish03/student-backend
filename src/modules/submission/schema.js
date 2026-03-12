import { z } from "zod";

const objectID = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createSubmissionSchema = z.object({
  assignment: objectID,
  student: objectID,
  file: z.url(),
  submissionDate: z.date().default(Date.now()),
});

export const editSubmissionSchema = createSubmissionSchema
  .omit({ assignment: true, student: true })
  .partial();
