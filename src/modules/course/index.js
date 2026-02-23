import { Router } from "express";
import { Course } from "./model.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  courseIdSchema,
  courseQuerySchema,
  createCourseSchema,
  updateCourseSchema,
} from "./schema.js";
import { User } from "../user/model.js";

const courseRouter = Router();

/**
 * @route   POST courses/
 * @desc    Create a new course
 * @access  Admin only
 * @params  None
 * @returns 201 - Course created successfully
 *          400 - Course already exists
 */
courseRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createCourseSchema }),
  async (req, res) => {
    try {
      const { name, code, teacher } = req.validatedBody;

      const teacherExist = await User.findById(teacher);

      if (!teacherExist) {
        return res.status(404).json({ message: "Teacher doesnot exist" });
      }

      const courseExist = await Course.findOne({ code });

      if (courseExist) {
        return res.status(400).json({ message: "Course already exists" });
      }

      const course = await Course.create({ name, code, teacher });

      return res
        .status(201)
        .json({ message: "Course created successfully", data: course });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET courses/
 * @desc    Get all courses
 * @access  All except guest
 * @params  None
 * @returns 200 - Courses array
 */
courseRouter.get(
  "/",
  protect,
  validate({ query: courseQuerySchema }),
  async (req, res) => {
    try {
      const { page, limit } = req.validatedQuery;

      const skip = (page - 1) * limit;

      const courses = await Course.find()
        .populate("teacher", "name email")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Course.countDocuments();

      return res.status(200).json({
        data: courses,
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
 * @route   GET courses/:id
 * @desc    Get course by id
 * @access  All except guests
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course data
 *          404 - Course not found
 */
courseRouter.get(
  "/:id",
  protect,
  validate({ params: courseIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({ data: course });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH courses/:id
 * @desc    Update course by id
 * @access  Admin only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course updated successfully
 *          404 - Course not found
 */
courseRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate({ body: updateCourseSchema, params: courseIdSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const { id } = req.validatedParams;

      if (data.code) {
        const codeExists = await Course.findOne({
          code: data.code,
          _id: { $ne: id },
        });

        if (codeExists) {
          return res
            .status(400)
            .json({ message: "Course code already exists" });
        }
      }

      const course = await Course.findOneAndUpdate({ _id: id }, data, {
        returnDocument: "after",
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res
        .status(200)
        .json({ message: "Course updated successfully", data: course });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH courses/:id/toggle
 * @desc    Toggle isActive field of course by id
 * @access  Admin only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course activated/deactivated successfully
 *          403 - Cannot toggle own status
 *          404 - Course not found
 */
courseRouter.patch(
  "/:id/toggle",
  protect,
  authorize("admin"),
  validate({ params: courseIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const course = await Course.findByIdAndUpdate(
        id,
        [{ $set: { isActive: { $not: "$isActive" } } }],
        { returnDocument: "after" },
      );

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({
        message: course.isActive
          ? "Course activated successfully"
          : "Course deactivated successfully",
        data: course,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE courses/:id
 * @desc    Delete course by id
 * @access  Admin only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course deleted successfully
 *          403 - Cannot delete own account
 *          404 - Course not found
 */
courseRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: courseIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const course = await Course.findByIdAndDelete(id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      return res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { courseRouter };
