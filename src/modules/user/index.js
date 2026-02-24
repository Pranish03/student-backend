import { Router } from "express";
import bcrypt from "bcryptjs";
import { validate } from "../../middlewares/validate.js";
import { User } from "./model.js";
import { generatePassword } from "../../utils/password.js";
import {
  createUserSchema,
  userIdSchema,
  userQuerySchema,
  updateUserSchema,
} from "./schema.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { sendEmail } from "../../utils/email.js";
import { USER_CREATED_TEMPLATE } from "../../templates/created.js";

const userRouter = Router();

/**
 * @route   POST users/
 * @desc    Create user
 * @access  Admin only
 * @params  None
 * @returns 201 - User created successfully
 *          400 - Email already taken
 */
userRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createUserSchema }),
  async (req, res) => {
    try {
      const { name, email, role } = req.validatedBody;

      const userExist = await User.findOne({ email });

      if (userExist) {
        return res.status(400).json({ message: "Email already taken" });
      }

      const randomPassword = generatePassword(12);

      if (process.env.NODE_ENV === "development") {
        console.log(randomPassword);
      }

      await sendEmail({
        email,
        subject: "Account Created",
        template: USER_CREATED_TEMPLATE({ name, email, randomPassword }),
      });

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
  },
);

/**
 * @route   GET users/
 * @desc    Get all users
 * @access  Admin & Teacher only
 * @params  None
 * @returns 200 - Users array
 */
userRouter.get(
  "/",
  protect,
  authorize("admin", "teacher"),
  validate({ query: userQuerySchema }),
  async (req, res) => {
    try {
      const { role, page, limit } = req.validatedQuery;

      const filter = role ? { role } : {};

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .select("-password")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      return res.status(200).json({
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET users/:id
 * @desc    Get user by id
 * @access  Admin & Teacher only
 * @params  id - User ID (MongoDB ObjectID)
 * @returns 200 - User data
 *          404 - User not found
 */
userRouter.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: userIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = user.toObject();

      return res.status(200).json({ data: safeUser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH users/:id
 * @desc    Update user by id
 * @access  Admin only
 * @params  id - User ID (MongoDB ObjectID)
 * @returns 200 - User updated successfully
 *          404 - User not found
 */
userRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate({ body: updateUserSchema, params: userIdSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const { id } = req.validatedParams;

      const user = await User.findOneAndUpdate({ _id: id }, data, {
        returnDocument: "after",
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...safeUser } = user.toObject();

      return res
        .status(200)
        .json({ message: "User updated successfully", data: safeUser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH users/toggle/:id
 * @desc    Toggle isActive field of user by id
 * @access  Admin only
 * @params  id - User ID (MongoDB ObjectID)
 * @returns 200 - User activated/deactivated successfully
 *          403 - Cannot toggle own status
 *          404 - User not found
 */
userRouter.patch(
  "/toggle/:id",
  protect,
  authorize("admin"),
  validate({ params: userIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      if (req.user._id.equals(id)) {
        return res
          .status(403)
          .json({ message: "You cannot toggle your own status" });
      }

      const user = await User.findByIdAndUpdate(
        id,
        [{ $set: { isActive: { $not: "$isActive" } } }],
        { returnDocument: "after" },
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: user.isActive
          ? "User activated successfully"
          : "User deactivated successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE users/:id
 * @desc    Delete user by id
 * @access  Admin only
 * @params  id - User ID (MongoDB ObjectID)
 * @returns 200 - User deleted successfully
 *          403 - Cannot delete own account
 *          404 - User not found
 */
userRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: userIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      if (req.user._id.equals(id)) {
        return res
          .status(403)
          .json({ message: "You cannot delete your own account" });
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { userRouter };
