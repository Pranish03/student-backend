import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validate } from "../../middlewares/validate.js";
import { User } from "./model.js";
import { generatePassword } from "../../utils/password.js";
import {
  createUserSchema,
  userIdSchema,
  userQuerySchema,
  loginSchema,
  updateUserSchema,
} from "./schema.js";

const userRouter = Router();

/**
 * @DESC   Create user endpoint
 * @PATH   POST users/
 * @ACCESS Admin only
 */
userRouter.post("/", validate({ body: createUserSchema }), async (req, res) => {
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
 * @DESC   Get all users
 * @PATH   GET users/
 * @Access Admin & Teacher only
 */
userRouter.get("/", validate({ query: userQuerySchema }), async (req, res) => {
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
});

/**
 * @DESC  Get user by id
 * @PATH  GET users/:id
 * @ADMIN Admin & Teacher only
 */
userRouter.get("/:id", validate({ params: userIdSchema }), async (req, res) => {
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
});

/**
 * @DESC  Update user by id
 * @PATH  PATCH users/:id
 * @ADMIN Admin only
 */
userRouter.patch(
  "/:id",
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
 * @DESC  Delete user by id
 * @PATH  DELETE users/:id
 * @ADMIN Admin only
 */
userRouter.delete(
  "/:id",
  validate({ params: userIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

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

/**
 * @DESC   User login endpoint
 * @PATH   POST users/login
 * @ACCESS Guest only
 */
userRouter.post("/login", validate({ body: loginSchema }), async (req, res) => {
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

export { userRouter };
