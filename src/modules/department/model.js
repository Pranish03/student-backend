import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Department =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);
