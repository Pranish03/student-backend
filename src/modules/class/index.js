import { Router } from "express";
import { Class } from "./model";
import { protect } from "../../middlewares/protect";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import {
  assignCourses,
  classIdSchema,
  createClassSchema,
  enrollStudents,
  removeCoursesSchema,
  removeStudentsSchema,
  updateClassSchema,
} from "./schema";
import { Course } from "../course/model";
import { User } from "../user/model";

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
      const { name, department, academicYear, capacity } = req.body;

      const existingClass = await Class.findOne({
        name,
        academicYear: new Date(academicYear),
      });

      if (existingClass) {
        return res.status(400).json({
          message: "Class with this name already exists for the academic year",
        });
      }

      const newClass = await Class.create({
        name,
        department,
        academicYear,
        capacity: capacity || 35,
      });

      res.status(201).json({
        message: "Class created successfully",
        data: newClass,
      });
    } catch (error) {
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
 *          400 - Class already exists
 */

classRouter.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("courses", "name code teacher")
      .populate("students", "name email")
      .collation({ locale: "en", strength: 2 })
      .sort({ name: 1 });

    res.status(200).json({
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET classes/:id
 * @desc    Get class by id
 * @access  Admin & Teacher only
 * @params  id - User ID (MongoDB ObjectID)
 * @returns 200 - Class data
 *          404 - Class not found
 */
classRouter.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: classIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const classData = await Class.findById(id)
        .populate("courses", "name code teacher")
        .populate("students", "name email");

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.status(200).json({ data: classData });
    } catch (error) {
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
      const { id } = req.params;
      const updateData = req.body;

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (updateData.name && updateData.name !== classData.name) {
        const existingClass = await Class.findOne({
          name: updateData.name,
          academicYear: updateData.academicYear || classData.academicYear,
          _id: { $ne: id },
        });

        if (existingClass) {
          return res.status(400).json({
            message:
              "Class with this name already exists for the academic year",
          });
        }
      }

      const updatedClass = await Class.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: "after", runValidators: true },
      ).populate("courses", "name code");

      res.status(200).json({
        message: "Class updated successfully",
        data: updatedClass,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH classes/update-student/:id
 * @desc    Enroll student/students to class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Students enrolled successfully
 *          404 - Class not found
 */
classRouter.patch(
  "/update-student/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: enrollStudents }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { students } = req.body;

      if (!students || students.length === 0) {
        return res.status(400).json({ message: "No students provided" });
      }

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const existingStudents = await User.find({
        _id: { $in: students },
        role: "student",
      });

      if (existingStudents.length !== students.length) {
        return res.status(400).json({
          message: "One or more students not found or are not students",
        });
      }

      const totalStudents = [
        ...new Set([
          ...classData.students.map((s) => s.toString()),
          ...students,
        ]),
      ];
      if (totalStudents.length > classData.capacity) {
        return res.status(400).json({
          message: `Cannot enroll students. Class capacity (${classData.capacity}) would be exceeded`,
        });
      }

      const updatedClass = await Class.findByIdAndUpdate(
        id,
        { $addToSet: { students: { $each: students } } },
        { returnDocument: "after" },
      ).populate("students", "name email");

      res.status(200).json({
        message: `${students.length} student(s) enrolled successfully`,
        data: {
          enrolledStudents: updatedClass.students,
          totalEnrolled: updatedClass.students.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH classes/update-course/:id
 * @desc    Assign course/courses to class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Courses assigned successfully
 *          404 - Class not found
 */
classRouter.patch(
  "/update-course/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: assignCourses }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { courses } = req.body;

      if (!courses || courses.length === 0) {
        return res.status(400).json({ message: "No courses provided" });
      }

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const existingCourses = await Course.find({ _id: { $in: courses } });
      if (existingCourses.length !== courses.length) {
        return res
          .status(400)
          .json({ message: "One or more courses not found" });
      }

      const updatedClass = await Class.findByIdAndUpdate(
        id,
        { $addToSet: { courses: { $each: courses } } },
        { returnDocument: "after" },
      ).populate("courses", "name code credits");

      res.status(200).json({
        message: `${courses.length} course(s) assigned successfully`,
        data: updatedClass.courses,
      });
    } catch (error) {
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
      const { id } = req.params;

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (classData.students.length > 0 || classData.courses.length > 0) {
        return res.status(400).json({
          message:
            "Cannot delete class with enrolled students or assigned courses. Remove them first.",
        });
      }

      await Class.findByIdAndDelete(id);

      res.status(200).json({
        message: "Class deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE classes/update-student/:id
 * @desc    Remove student/students from class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - Student removed successfully
 *          404 - Class not found
 */
classRouter.delete(
  "/update-student/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: removeStudentsSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { students } = req.body;

      if (!students || students.length === 0) {
        return res.status(400).json({ message: "No students provided" });
      }

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const enrolledStudentIds = classData.students.map((s) => s.toString());
      const invalidStudents = students.filter(
        (s) => !enrolledStudentIds.includes(s),
      );

      if (invalidStudents.length > 0) {
        return res
          .status(400)
          .json({ message: "Some students are not enrolled in this class" });
      }

      const updatedClass = await Class.findByIdAndUpdate(
        id,
        { $pullAll: { students: students } },
        { returnDocument: "after" },
      ).populate("students", "name email");

      res.status(200).json({
        message: `${students.length} student(s) removed successfully`,
        data: {
          remainingStudents: updatedClass.students,
          totalRemaining: updatedClass.students.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE classes/update-course/:id
 * @desc    Remove course/courses from class
 * @access  Admin only
 * @params  id - Class ID (MongoDB ObjectID)
 * @returns 200 - course removed successfully
 *          404 - Class not found
 */
classRouter.delete(
  "/update-course/:id",
  protect,
  authorize("admin"),
  validate({ params: classIdSchema, body: removeCoursesSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { courses } = req.body;

      if (!courses || courses.length === 0) {
        return res.status(400).json({ message: "No courses provided" });
      }

      const classData = await Class.findById(id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const assignedCourseIds = classData.courses.map((c) => c.toString());
      const invalidCourses = courses.filter(
        (c) => !assignedCourseIds.includes(c),
      );

      if (invalidCourses.length > 0) {
        return res
          .status(400)
          .json({ message: "Some courses are not assigned to this class" });
      }

      const updatedClass = await Class.findByIdAndUpdate(
        id,
        { $pullAll: { courses: courses } },
        { returnDocument: "after" },
      ).populate("courses", "name code");

      res.status(200).json({
        message: `${courses.length} course(s) removed successfully`,
        data: updatedClass.courses,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { classRouter };
