import mongoose from "mongoose";

export const connectDB = (startServer) => {
  try {
    const connection = mongoose.connect(process.env.MONGO_URI);

    if (!connection) {
      throw new Error("Connection failed");
    }

    startServer();
  } catch (error) {
    console.error("Failed to connrct to DB", error);
  }
};
