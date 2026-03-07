import mongoose from "mongoose";

const timeTableEntrySchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
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
