import { Router } from "express";
import { Class } from "./model.js";
import { Course } from "../course/model.js";
import { User } from "../user/model.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  classIdSchema,
  createClassSchema,
  updateClassSchema,
  enrollStudents,
  assignCourses,
  removeStudentsSchema,
  removeCoursesSchema,
} from "./schema.js";

const classRouter = Router();

/**
 * @route   POST classes/
 * @desc    Create class
 * @access  Admin only
 * @params  None
 * @returns 201 - Class created successfully
 */
classRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createClassSchema }),
  async (req, res) => {
    try {
      const {
        name,
        department,
        academicYear,
        capacity = 35,
      } = req.validatedBody;

      const exists = await Class.findOne({
        name,
        academicYear: new Date(academicYear),
      });

      if (exists) {
        return res.status(400).json({
          message: "Class already exists for this academic year",
        });
      }

      const newClass = await Class.create({
        name,
        department,
        academicYear,
        capacity,
      });

      res.status(201).json({
        message: "Class created successfully",
        data: newClass,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET classes/
 * @desc    Get all classes
 * @access  Admin only
 * @params  None
 * @returns 200 - Classes array
 *          500 - Internal server error
 */
classRouter.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate({
        path: "students",
        select: "name email",
      })
      .populate("courses", "name code teacher")
      .sort({ name: 1 });

    const sortedClasses = classes.map((cls) => {
      const obj = cls.toObject();

      obj.students.sort((a, b) => a.name.localeCompare(b.name));

      return obj;
    });

    res.json({
      count: sortedClasses.length,
      data: sortedClasses,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

classRouter.get("/my", protect, authorize("student"), async (req, res) => {
  try {
    const classId = req.user.class;
    if (!classId) {
      return res
        .status(404)
        .json({ message: "You are not enrolled in any class" });
    }

    const classData = await Class.findById(classId)
      .populate({
        path: "courses",
        select: "name code teacher class",
        populate: [
          { path: "teacher", select: "name email" },
          { path: "class", select: "name department academicYear" },
        ],
      })
      .populate("students", "name email");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json({ data: classData });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET classes/:id
 * @desc    Get class by id
 * @access  Admin & Teacher only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Class data
 *          404 - Class not found
 *          500 - Internal server error
 */
classRouter.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: classIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const classData = await Class.findById(id)
        .populate("courses", "name code teacher")
        .populate("students", "name email");

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const data = classData.toObject();

      data.students.sort((a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
      );

      res.json({ data });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH classes/:id
 * @desc    Update class by id
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Class updated successfully
 *          404 - Class not found
 */
classRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: updateClassSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const data = req.validatedBody;

      const updated = await Class.findByIdAndUpdate(id, data, {
        returnDocument: "after",
        runValidators: true,
      }).populate("courses", "name code");

      if (!updated) return res.status(404).json({ message: "Class not found" });

      res.json({
        message: "Class updated successfully",
        data: updated,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH classes/:id/students
 * @desc    Enroll student(s) to class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Student(s) enrolled successfully
 *          404 - Class not found
 */
classRouter.patch(
  "/:id/students",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: enrollStudents }),
  async (req, res) => {
    try {
      const { id: classId } = req.validatedParams;
      const { students } = req.validatedBody;

      const classData = await Class.findById(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const validStudents = await User.find({
        _id: { $in: students },
        role: "student",
      });

      if (validStudents.length !== students.length) {
        return res.status(400).json({
          message: "Some users are not valid students",
        });
      }

      await Class.updateMany(
        { students: { $in: students } },
        { $pull: { students: { $in: students } } },
      );

      await User.updateMany(
        { _id: { $in: students } },
        { $set: { class: classId } },
      );

      const updated = await Class.findByIdAndUpdate(
        classId,
        { $addToSet: { students: { $each: students } } },
        { new: true },
      ).populate("students", "name email");

      return res.json({
        message: "Students enrolled successfully",
        data: updated.students,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH classes/:id/courses
 * @desc    Assign course(s) to class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Course(s) assigned successfully
 *          404 - Class not found
 */
classRouter.patch(
  "/:id/courses",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: assignCourses }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const { courses } = req.validatedBody;

      const classData = await Class.findById(id);

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const existing = await Course.find({ _id: { $in: courses } });
      if (existing.length !== courses.length) {
        return res.status(400).json({
          message: "Some courses not found",
        });
      }

      await Class.updateMany(
        { courses: { $in: courses } },
        { $pull: { courses: { $in: courses } } },
      );

      await Course.updateMany(
        { _id: { $in: courses } },
        { $set: { class: id } },
      );

      const updated = await Class.findByIdAndUpdate(
        id,
        { $addToSet: { courses: { $each: courses } } },
        { new: true },
      ).populate("courses", "name code");

      res.json({
        message: "Courses assigned successfully",
        data: updated.courses,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE classes/:id/students
 * @desc    Remove student(s) from class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Student(s) removed successfully
 *          404 - Class not found
 */
classRouter.delete(
  "/:id/students",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: removeStudentsSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
      const { students } = req.validatedBody;

      const updated = await Class.findByIdAndUpdate(
        id,
        { $pullAll: { students } },
        { new: true },
      ).populate("students", "name email");

      if (!updated) {
        return res.status(404).json({ message: "Class not found" });
      }

      await User.updateMany(
        { _id: { $in: students } },
        { $unset: { class: "" } },
      );

      return res.json({
        message: "Students removed",
        data: updated.students,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE classes/:id/courses
 * @desc    Remove course(s) from class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Course(s) removed successfully
 *          404 - Class not found
 */
classRouter.delete(
  "/:id/courses",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: removeCoursesSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const { courses } = req.validatedBody;

      const updated = await Class.findByIdAndUpdate(
        id,
        { $pullAll: { courses } },
        { new: true },
      ).populate("courses", "name code");

      await Course.updateMany(
        { _id: { $in: courses } },
        { $unset: { class: "" } },
      );

      if (!updated) return res.status(404).json({ message: "Class not found" });

      res.json({
        message: "Courses removed",
        data: updated.courses,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE classes/:id
 * @desc    Delete class by id
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Class deleted successfully
 *          404 - Class not found
 */
classRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (classData.students.length || classData.courses.length) {
        return res.status(400).json({
          message: "Remove students and courses before deleting class",
        });
      }

      await classData.deleteOne();

      res.json({ message: "Class deleted successfully" });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { classRouter };
