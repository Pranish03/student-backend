import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Batch =
  mongoose.models.Batch || mongoose.model("Batch", batchSchema);
