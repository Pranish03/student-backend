import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import { userRouter } from "./modules/user/index.js";
import { authRouter } from "./modules/auth/index.js";

config();
const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectDB(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on http://localhost:5000");
  });
});
