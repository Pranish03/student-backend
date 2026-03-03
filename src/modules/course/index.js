import { Router } from "express";
import { Course } from "./model.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  courseIdSchema,
  createCourseSchema,
  updateCourseSchema,
  updateCourseTeacherSchema,
} from "./schema.js";
import { User } from "../user/model.js";

const courseRouter = Router();

/**
 * @route   POST courses/
 * @desc    Create a new course
 * @access  Admin only
 */
courseRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createCourseSchema }),
  async (req, res) => {
    try {
      const { name, code, teacher } = req.validatedBody;

      if (teacher) {
        const teacherExist = await User.findById(teacher);
        if (!teacherExist) {
          return res.status(404).json({ message: "Teacher does not exist" });
        }
      }

      const courseExist = await Course.findOne({ code });
      if (courseExist) {
        return res.status(409).json({ message: "Course already exists" });
      }

      const course = await Course.create({ name, code, teacher });
      await course.populate("teacher", "name email");

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
 */
courseRouter.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teacher", "name email")
      .collation({ locale: "en", strength: 2 })
      .sort({ name: 1 });

    return res.status(200).json({
      data: courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET courses/:id
 * @desc    Get course by id
 * @access  All except guests
 */
courseRouter.get(
  "/:id",
  protect,
  validate({ params: courseIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const course = await Course.findById(id).populate(
        "teacher",
        "name email",
      );

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
 * @desc    Update course details (name, code only - not teacher)
 * @access  Admin only
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

      // Explicitly prevent teacher updates in this route
      if (data.teacher) {
        return res.status(400).json({
          message: "Use /update-teacher/:id route to update teacher",
        });
      }

      if (data.code) {
        const codeExists = await Course.findOne({
          code: data.code,
          _id: { $ne: id },
        });

        if (codeExists) {
          return res
            .status(409)
            .json({ message: "Course code already exists" });
        }
      }

      const course = await Course.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).populate("teacher", "name email");

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
 * @route   PATCH courses/update-teacher/:id
 * @desc    Assign teacher to course
 * @access  Admin only
 */
courseRouter.patch(
  "/update-teacher/:id",
  protect,
  authorize("admin"),
  validate({ body: updateCourseTeacherSchema, params: courseIdSchema }),
  async (req, res) => {
    try {
      const { teacher } = req.validatedBody;
      const { id } = req.validatedParams;

      const teacherExists = await User.findById(teacher);
      if (!teacherExists) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      course.teacher = teacher;
      await course.save();
      await course.populate("teacher", "name email");

      return res.status(200).json({
        message: "Course teacher assigned successfully",
        data: course,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE courses/update-teacher/:id
 * @desc    Remove teacher from course
 * @access  Admin only
 */
courseRouter.delete(
  "/update-teacher/:id",
  protect,
  authorize("admin"),
  validate({ params: courseIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      course.teacher = null;
      await course.save();
      await course.populate("teacher", "name email");

      return res.status(200).json({
        message: "Course teacher removed successfully",
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
