import mongoose from "mongoose";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeTableEntrySchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    day: {
      type: String,
      enum: daysOfWeek,
      required: true,
    },
    startTime: {
      type: String,
      match: timeRegex,
      required: true,
    },
    endTime: {
      type: String,
      match: timeRegex,
      required: true,
    },
    room: {
      type: String,
      default: "TBD",
    },
  },
  { _id: true },
);

const scheduleSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      unique: true,
      index: true,
    },

    timeTable: [timeTableEntrySchema],
  },
  { timestamps: true },
);

export const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
