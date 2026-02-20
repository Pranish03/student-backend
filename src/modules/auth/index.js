import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validate } from "../../middlewares/validate.js";
import { protect } from "../../middlewares/protect.js";
import { User } from "../user/model.js";
import {
  loginSchema,
  resetTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "./schema.js";
import { generateTokenAndSetCookie } from "../../utils/cookie.js";

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

    generateTokenAndSetCookie(res, user._id);

    const { password, ...safeUser } = user.toObject();

    return res
      .status(200)
      .json({ message: "Logged in successfully", data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @DESC   Forgot password endpoint
 * @PATH   POST users/forgot-password
 * @ACCESS Guest only
 */
authRouter.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  async (req, res) => {
    try {
      const { email } = req.validatedBody;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = crypto.randomBytes(20).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

      user.resetToken = hashedToken;

      user.resetTokenExpiresAt = resetTokenExpiresAt;

      await user.save();

      // Send email here

      if (process.env.NODE_ENV === "development") {
        console.log(resetToken);
      }

      res
        .status(200)
        .json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @DESC   Reset password endpoint
 * @PATH   POST users/reset-password/:token
 * @ACCESS Guest only
 */
authRouter.post(
  "/reset-password/:token",
  validate({ body: resetPasswordSchema, params: resetTokenSchema }),
  async (req, res) => {
    try {
      const { token } = req.validatedParams;

      const data = req.validatedBody;

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetToken: hashedToken,
        resetTokenExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      user.password = hashedPassword;

      user.resetToken = undefined;

      user.resetTokenExpiresAt = undefined;

      await user.save();

      // Send email here

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @DESC   Logout endpoint
 * @PATH   GET users/logout
 * @ACCESS All except guest
 */
authRouter.get("/logout", protect, async (req, res) => {
  try {
    res.clearCookie("auth-token");

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { authRouter };
