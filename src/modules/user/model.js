import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
      default: "student",
    },
    course: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: false,
      },
    ],
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: false,
    },
    isActive: { type: Boolean, default: true },
    resetToken: String,
    resetTokenExpiresAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
