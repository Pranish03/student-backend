// Auth
import { Router } from "express";

const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { authRouter };
