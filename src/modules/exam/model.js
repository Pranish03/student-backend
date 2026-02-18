
import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    examType: { type: String, enum: ["midterm", "final"], required: true },
    examDate: { type: Date, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true },
);

export const Exam = mongoose.models.Exam || mongoose.model("Exam", examSchema);
