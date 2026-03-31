import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db.js";
import { userRouter } from "./modules/user/index.js";
import { authRouter } from "./modules/auth/index.js";
import { courseRouter } from "./modules/course/index.js";
import { classRouter } from "./modules/class/index.js";
import { scheduleRouter } from "./modules/schedule/index.js";
import { attendanceRouter } from "./modules/attendance/index.js";
import { resourceRouter } from "./modules/resource/index.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: [process.env.CLIENT_URL], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/courses", courseRouter);
app.use("/classes", classRouter);
app.use("/schedules", scheduleRouter);
app.use("/attendances", attendanceRouter);
app.use("/resources", resourceRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
