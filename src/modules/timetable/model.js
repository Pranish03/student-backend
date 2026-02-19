import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    schedule: [
      {
        day: { type: String, required: true },
        periods: [
          {
            course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
            teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

timetableSchema.index({ class: 1, batch: 1 }, { unique: true });

export const Timetable =
  mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
