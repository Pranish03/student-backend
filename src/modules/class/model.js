import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: { type: String, required: true },
    academicYear: { type: Date, required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    capacity: { type: Number, default: 35 },
  },
  { timestamps: true },
);

export const Class =
  mongoose.models.Class || mongoose.model("Class", classSchema);
