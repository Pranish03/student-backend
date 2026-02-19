import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    capicity: { type: Number, default: 35 },
  },
  { timestamps: true },
);

classSchema.index({ name: 1, batch: 1 }, { unique: true });

export const Class =
  mongoose.models.Class || mongoose.model("Class", classSchema);
