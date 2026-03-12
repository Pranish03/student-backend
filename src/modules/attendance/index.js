import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  attendanceQuerySchema,
  createAttendanceSchema,
  editAttendanceSchema,
  idParamSchema,
  objectID,
} from "./schema.js";
import { Attendance } from "./model.js";

const attendanceRouter = Router();

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

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

      const normalizedDate = normalizeDate(data.date);

      const exists = await Attendance.exists({
        course: data.course,
        date: normalizedDate,
      });

      if (exists) {
        return res.status(400).json({
          message: "Attendance for this course on this date already exists",
        });
      }

      const attendance = await Attendance.create({
        course: data.course,
        date: normalizedDate,
        attendance: data.attendance,
      });

      await attendance.populate("attendance.student", "name email");

      return res.status(201).json({
        message: "Attendance recorded successfully",
        data: attendance,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Attendance for this course on this date already exists",
        });
      }

      console.error("Create attendance error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET attendances/:id/summarry
 * @desc    Get attendances summary by course id
 * @access  Admin & Teacher only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course attendance summary
 *          404 - No records found
 *          500 - Internal server error
 */
attendanceRouter.get(
  "/:id/summary",
  protect,
  authorize("admin", "teacher"),
  validate({ params: idParamSchema }),
  async (req, res) => {
    try {
      const courseId = req.validatedParams.id;

      const attendanceRecords = await Attendance.find({ course: courseId })
        .populate("attendance.student", "name email")
        .sort({ date: -1 })
        .lean();

      if (!attendanceRecords.length) {
        return res
          .status(404)
          .json({ message: "No attendance records found for this course" });
      }

      const summary = {};

      for (const record of attendanceRecords) {
        for (const a of record.attendance) {
          const studentId = a.student._id.toString();

          if (!summary[studentId]) {
            summary[studentId] = {
              studentId,
              studentName: a.student.name,
              totalClasses: 0,
              present: 0,
              absent: 0,
              attendancePercentage: 0,
            };
          }

          summary[studentId].totalClasses++;

          if (a.isPresent) summary[studentId].present++;
          else summary[studentId].absent++;
        }
      }

      for (const student of Object.values(summary)) {
        student.attendancePercentage =
          (student.present / student.totalClasses) * 100;
      }

      return res.status(200).json({
        message: "Attendance summary retrieved successfully",
        data: {
          totalClasses: attendanceRecords.length,
          summary: Object.values(summary),
        },
      });
    } catch (error) {
      console.error("Attendance summary error:", error);
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
  validate({ params: idParamSchema, query: attendanceQuerySchema }),
  async (req, res) => {
    try {
      const courseId = req.validatedParams.id;
      const { date } = req.validatedQuery;

      const filter = { course: courseId };

      if (date) {
        filter.date = normalizeDate(date);
      }

      const attendances = await Attendance.find(filter)
        .populate("course", "name code")
        .populate("attendance.student", "name email")
        .sort({ date: -1 })
        .lean();

      if (!attendances.length) {
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
    } catch (error) {
      console.error("Get attendance error:", error);
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
 *          404 - No records found
 *          500 - Internal server error
 */
attendanceRouter.patch(
  "/:id",
  protect,
  authorize("teacher"),
  validate({ body: editAttendanceSchema, params: idParamSchema }),
  async (req, res) => {
    try {
      const attendanceId = req.validatedParams.id;
      const updateData = req.validatedBody;

      const attendance = await Attendance.findById(attendanceId);

      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      if (updateData.attendance) {
        const map = new Map(
          attendance.attendance.map((a) => [a.student.toString(), a]),
        );

        for (const record of updateData.attendance) {
          const id = record.student.toString();

          if (map.has(id)) {
            map.get(id).isPresent = record.isPresent;
          } else {
            attendance.attendance.push(record);
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
    } catch (error) {
      console.error("Update attendance error:", error);
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
 *          404 - No records found
 *          500 - Internal server error
 */
attendanceRouter.delete(
  "/:id",
  protect,
  authorize("teacher"),
  validate({ params: idParamSchema }),
  async (req, res) => {
    try {
      const attendanceId = req.validatedParams.id;

      const attendance = await Attendance.findById(attendanceId);

      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      await attendance.deleteOne();

      return res.status(200).json({
        message: "Attendance record deleted successfully",
      });
    } catch (error) {
      console.error("Delete attendance error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { attendanceRouter };
