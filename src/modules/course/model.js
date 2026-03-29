import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

export const Course =
  mongoose.models.Course || mongoose.model("Course", courseSchema);
