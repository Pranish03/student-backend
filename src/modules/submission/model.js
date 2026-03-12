import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    file: { type: String, required: true },
    submissionDate: { type: Date, default: Date.now() },
  },
  { timestamps: true },
);

export const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
