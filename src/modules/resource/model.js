import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    type: { type: String, enum: ["note", "assignment"], required: true },
    title: { type: String, required: true },
    description: { type: String },
    file: { type: String },
    deadline: {
      type: Date,
      required: function () {
        return this.type === "assignment";
      },
    },
  },
  {
    timestamps: true,
  },
);

export const Resource =
  mongoose.models.Resource || mongoose.model("Resource", resourceSchema);
