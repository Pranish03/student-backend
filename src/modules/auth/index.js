import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validate } from "../../middlewares/validate.js";
import { User } from "../user/model.js";
import { loginSchema } from "./schema.js";

const authRouter = Router();

/**
 * @DESC   User login endpoint
 * @PATH   POST users/login
 * @ACCESS Guest only
 */
authRouter.post("/login", validate({ body: loginSchema }), async (req, res) => {
  try {
    const data = req.validatedBody;

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

    const { password, ...safeUser } = user.toObject();

    return res
      .status(200)
      .json({ message: "Logged in successfully", token, data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { authRouter };
