import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validate } from "../../middlewares/validate.js";
import { loginSchema } from "./schema.js";
import { User } from "./model.js";

const authRouter = Router();

/**
 * @DESC Login endpoint
 * @API  POST auth/login
 */

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const data = req.validated;

    const user = await User.findOne({ email: data.email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(data.password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: data._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password, ...safeUser } = user;

    return res
      .status(200)
      .json({ message: "Logged in successfully", token, data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { authRouter };
