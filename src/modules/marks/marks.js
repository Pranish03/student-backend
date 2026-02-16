import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    marks: { type: Number, required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
  },
  { timestamps: true },
);

export const Marks =
  mongoose.models.Marks || mongoose.model("Marks", marksSchema);