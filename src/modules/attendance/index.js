import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createAttendanceSchema,
  editAttendanceSchema,
  objectID,
} from "./schema.js";

const attendanceRouter = Router();

/**
 * @route   POST attendances/
 * @desc    Create a course attendances
 * @access  Teacher only
 * @params  None
 * @returns 201 - Record added successfully
 */
attendanceRouter.post(
  "/",
  protect,
  authorize("teacher"),
  validate({ body: createAttendanceSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET attendances/
 * @desc    Get all attendances
 * @access  Admin only
 * @params  None
 * @returns 200 - Attendances data
 */
attendanceRouter.get("/", protect, authorize("admin"), async (req, res) => {
  try {
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET attendances/:id?date=yyyy-mm-dd
 * @desc    Get attendances by course id and date
 * @access  Admin & Teacher only
 * @params  id - Course ID (MongoDB ObjectID)
 * @returns 200 - Course attendance data
 */
attendanceRouter.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: objectID }),
  async (req, res) => {
    try {
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
  validate({ body: editAttendanceSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;
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
