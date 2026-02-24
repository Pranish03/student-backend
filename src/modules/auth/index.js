import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validate } from "../../middlewares/validate.js";
import { protect } from "../../middlewares/protect.js";
import { User } from "../user/model.js";
import {
  loginSchema,
  resetTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "./schema.js";
import { clearCookie, generateTokenAndSetCookie } from "../../utils/cookie.js";
import { RESET_PASSWORD_TEMPLATE } from "../../templates/reset.js";
import { sendEmail } from "../../utils/email.js";
import { SUCCESS_TEMPLATE } from "../../templates/success.js";
import { PASSWORD_UPDATE_TEMPLATE } from "../../templates/updated.js";

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

      const resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;

      user.resetToken = hashedToken;

      user.resetTokenExpiresAt = resetTokenExpiresAt;

      await user.save();

      if (process.env.NODE_ENV === "development") {
        console.log(resetToken);
      }

      await sendEmail({
        email,
        subject: "Reset Your Password",
        template: RESET_PASSWORD_TEMPLATE({
          name: user.name,
          resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
        }),
      });

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

      sendEmail({
        email: user.email,
        subject: "Password Reset Successful",
        template: SUCCESS_TEMPLATE({
          name: user.name,
          loginUrl: process.env.CLIENT_URL,
        }),
      });

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @DESC   Update password endpoint
 * @PATH   POST users/update-password
 * @ACCESS All except guest
 */
authRouter.post(
  "/update-password",
  protect,
  validate({ body: updatePasswordSchema }),
  async (req, res) => {
    try {
      const userId = req.user._id;

      const data = req.validatedBody;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(data.currentPassword, user.password);

      if (!match) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      const same = await bcrypt.compare(data.newPassword, user.password);

      if (same) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12);

      user.password = hashedPassword;

      await user.save();

      clearCookie(res);

      sendEmail({
        email: user.email,
        subject: "Password Update Successful",
        template: PASSWORD_UPDATE_TEMPLATE({
          name: user.name,
          loginUrl: process.env.CLIENT_URL,
        }),
      });

      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @DESC   Status endpoint
 * @PATH   GET users/me
 * @ACCESS All except guest
 */
authRouter.get("/me", protect, async (req, res) => {
  try {
    const user = req.user;

    const { password, ...safeUser } = user;

    return res
      .status(200)
      .json({ message: "You are logged in", data: safeUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @DESC   Logout endpoint
 * @PATH   GET users/logout
 * @ACCESS All except guest
 */
authRouter.get("/logout", protect, async (req, res) => {
  try {
    clearCookie(res);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { authRouter };
