import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";

const app = express();
config();

app.use(express.json());

app.get("/", (req, res) => {
  req.send("Hello World!");
});

connectDB(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on http://localhost:5000");
  });
});
