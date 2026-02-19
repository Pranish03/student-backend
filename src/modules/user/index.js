import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validate } from "../../middlewares/validate.js";
import { createUserSchema, loginSchema } from "./schema.js";
import { User } from "./model.js";
import { generatePassword } from "../../utils/password.js";

const userRouter = Router();

/**
 * @DESC   Create user endpoint
 * @PATH   POST user/
 * @ACCESS Admin
 */
userRouter.post("/", validate(createUserSchema), async (req, res) => {
  try {
    const { name, email, role } = req.validated;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "Email already taken" });
    }

    const randomPassword = generatePassword(12);

    if (process.env.NODE_ENV === "development") {
      console.log(randomPassword);
    }

    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const { password, ...safeUser } = user.toObject();

    return res
      .status(201)
      .json({ message: "User created successfully", data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @DESC Login endpoint
 * @PATH POST user/login
 */

userRouter.post("/login", validate(loginSchema), async (req, res) => {
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

    const { password, ...safeUser } = user.toObject();

    return res
      .status(200)
      .json({ message: "Logged in successfully", token, data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { userRouter };
