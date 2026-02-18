import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, min: 1 },
    part: { type: Number, required: true, enum: [1, 2] },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Semester =
  mongoose.models.Semester || mongoose.model("Semester", semesterSchema);
