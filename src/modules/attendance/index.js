import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createAttendanceSchema,
  editAttendanceSchema,
  objectID,
} from "./schema.js";
import { Attendance } from "./model.js";

const attendanceRouter = Router();

/**
 * @route   POST attendances/
 * @desc    Create a course attendances
 * @access  Teacher only
 * @params  None
 * @returns 201 - Record added successfully
 *          400 - Record already exists
 *          500 - Internal server error
 */
attendanceRouter.post(
  "/",
  protect,
  authorize("teacher"),
  validate({ body: createAttendanceSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const startOfDay = new Date(data.date);

      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(data.date);

      endOfDay.setHours(23, 59, 59, 999);

      const existingAttendance = await Attendance.findOne({
        course: data.course,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingAttendance) {
        return res.status(400).json({
          message: "Attendance for this course on this date already exists",
        });
      }

      const attendance = new Attendance({
        course: data.course,
        date: data.date,
        attendance: data.attendance,
      });

      await attendance.save();

      await attendance.populate("attendance.student", "name email");

      return res.status(201).json({
        message: "Attendance recorded successfully",
        data: attendance,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET attendances/:id?date=yyyy-mm-dd
 * @desc    Get attendances by course id and date
 * @access  Admin & Teacher only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course attendance data
 *          404 - No records found
 *          500 - Internal server error
 */
attendanceRouter.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: objectID }),
  async (req, res) => {
    try {
      const courseId = req.validatedParams.id;
      const { date } = req.validatedQuery;

      let filter = { course: courseId };

      if (date) {
        const startOfDay = new Date(date);

        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);

        endOfDay.setHours(23, 59, 59, 999);

        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }

      const attendances = await Attendance.find(filter)
        .populate("course", "name code")
        .populate("attendance.student", "name email")
        .sort({ date: -1 });

      if (!attendances || attendances.length === 0) {
        return res.status(404).json({
          message: date
            ? "No attendance found for this course on the specified date"
            : "No attendance records found for this course",
        });
      }

      return res.status(200).json({
        message: "Attendance retrieved successfully",
        data: attendances,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH attendances/:id
 * @desc    Update attendances by attendance id
 * @access  Teacher only
 * @params  id - Attendance ID (MongoDB ObjectID)
 * @returns 200 - Record updated successfully
 */
attendanceRouter.patch(
  "/:id",
  protect,
  authorize("teacher"),
  validate({ body: editAttendanceSchema, params: objectID }),
  async (req, res) => {
    try {
      const attendanceId = req.validatedParams.id;
      const updateData = req.validatedBody;

      const attendance = await Attendance.findById(attendanceId);

      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      if (updateData.attendance) {
        const existingAttendanceMap = new Map(
          attendance.attendance.map((a) => [a.student.toString(), a]),
        );

        for (const newRecord of updateData.attendance) {
          if (existingAttendanceMap.has(newRecord.student)) {
            const index = attendance.attendance.findIndex(
              (a) => a.student.toString() === newRecord.student,
            );

            attendance.attendance[index].isPresent = newRecord.isPresent;
          } else {
            attendance.attendance.push(newRecord);
          }
        }

        await attendance.save();
      }

      await attendance.populate([
        { path: "course", select: "name code" },
        { path: "attendance.student", select: "name email" },
      ]);

      return res.status(200).json({
        message: "Attendance updated successfully",
        data: attendance,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE attendances/:id
 * @desc    Delete attendances by attendance id
 * @access  Teacher only
 * @params  id - Attendance ID (MongoDB ObjectID)
 * @returns 200 - Record deleted successfully
 */
attendanceRouter.patch(
  "/:id",
  protect,
  authorize("teacher"),
  validate({ params: objectID }),
  async (req, res) => {
    try {
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { attendanceRouter };
