import mongoose from "mongoose";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const scheduleSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    day: { type: String, enum: daysOfWeek, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    room: { type: String, default: "TBD" },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

scheduleSchema.index({ class: 1, day: 1, start_time: 1 }, { unique: true });

export const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
