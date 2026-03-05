// routes/scheduleRoutes.js
import { Router } from "express";
import { Schedule } from "./model";
import { Class } from "../class/model";
import { Course } from "../course/model";
import { User } from "../user/model";

import { protect } from "../../middlewares/protect";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";

import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdSchema,
  classSchedulesSchema,
  bulkCreateSchedulesSchema,
  checkAvailabilitySchema,
} from "./schema";

const scheduleRouter = Router();

// Helper to check for time conflicts
async function hasTimeConflict(
  classId,
  day,
  start_time,
  end_time,
  excludeId = null,
) {
  const query = {
    class: classId,
    day,
    _id: { $ne: excludeId },
    $or: [
      {
        start_time: { $lt: end_time },
        end_time: { $gt: start_time },
      },
    ],
  };

  const conflicting = await Schedule.findOne(query);
  return !!conflicting;
}

/**
 * @route   POST schedules/
 * @desc    Create a single schedule
 * @access  Admin only
 */
scheduleRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createScheduleSchema }),
  async (req, res) => {
    try {
      const {
        class: classId,
        course,
        day,
        start_time,
        end_time,
        room,
        teacher,
      } = req.validatedBody;

      // Verify class exists
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Verify course exists
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Verify teacher exists if provided
      if (teacher) {
        const teacherExists = await User.findOne({
          _id: teacher,
          role: "teacher",
        });
        if (!teacherExists) {
          return res.status(404).json({ message: "Teacher not found" });
        }
      }

      // Check for time conflicts
      const hasConflict = await hasTimeConflict(
        classId,
        day,
        start_time,
        end_time,
      );
      if (hasConflict) {
        return res.status(409).json({
          message: "Schedule conflicts with existing class schedule",
        });
      }

      const schedule = await Schedule.create({
        class: classId,
        course,
        day,
        start_time,
        end_time,
        room,
        teacher,
      });

      await schedule.populate([
        { path: "class", select: "name" },
        { path: "course", select: "name code" },
        { path: "teacher", select: "name email" },
      ]);

      res.status(201).json({
        message: "Schedule created successfully",
        data: schedule,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   POST schedules/bulk
 * @desc    Create multiple schedules at once (for full timetable)
 * @access  Admin only
 */
scheduleRouter.post(
  "/bulk",
  protect,
  authorize("admin"),
  validate({ body: bulkCreateSchedulesSchema }),
  async (req, res) => {
    try {
      const { schedules } = req.validatedBody;
      const created = [];
      const errors = [];

      for (let i = 0; i < schedules.length; i++) {
        const item = schedules[i];

        try {
          // Verify references
          const [classExists, courseExists] = await Promise.all([
            Class.findById(item.class),
            Course.findById(item.course),
          ]);

          if (!classExists)
            throw new Error(`Class not found for schedule ${i + 1}`);
          if (!courseExists)
            throw new Error(`Course not found for schedule ${i + 1}`);

          // Check conflict
          const conflict = await hasTimeConflict(
            item.class,
            item.day,
            item.start_time,
            item.end_time,
          );

          if (conflict) {
            throw new Error(
              `Time conflict on ${item.day} at ${item.start_time}`,
            );
          }

          const schedule = await Schedule.create(item);
          created.push(schedule);
        } catch (err) {
          errors.push({ index: i, error: err.message });
        }
      }

      res.status(201).json({
        message: `Created ${created.length} schedules`,
        data: { created, errors: errors.length ? errors : undefined },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET schedules/class/:classId
 * @desc    Get full timetable for a class (grouped by day)
 * @access  Admin, Teacher, Students of that class
 */
scheduleRouter.get(
  "/class/:classId",
  protect,
  authorize("admin", "teacher", "student"),
  validate({ params: classSchedulesSchema }),
  async (req, res) => {
    try {
      const { classId } = req.validatedParams;

      // Students can only view their own class
      if (req.user.role === "student") {
        const student = await User.findById(req.user._id);
        if (!student.class || student.class.toString() !== classId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const schedules = await Schedule.find({ class: classId })
        .populate("course", "name code")
        .populate("teacher", "name")
        .sort({ day: 1, start_time: 1 });

      // Group by day for organized timetable
      const timetable = schedules.reduce((acc, schedule) => {
        if (!acc[schedule.day]) {
          acc[schedule.day] = [];
        }
        acc[schedule.day].push(schedule);
        return acc;
      }, {});

      res.json({
        class: classId,
        data: timetable,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET schedules/check-availability
 * @desc    Check if a time slot is available for a class
 * @access  Admin
 */
scheduleRouter.get(
  "/check-availability",
  protect,
  authorize("admin"),
  validate({ query: checkAvailabilitySchema }),
  async (req, res) => {
    try {
      const {
        class: classId,
        day,
        start_time,
        end_time,
        excludeScheduleId,
      } = req.validatedQuery;

      const conflict = await hasTimeConflict(
        classId,
        day,
        start_time,
        end_time,
        excludeScheduleId,
      );

      res.json({
        available: !conflict,
        message: conflict
          ? "Time slot is already taken"
          : "Time slot is available",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET schedules/:id
 * @desc    Get schedule by ID
 * @access  Admin
 */
scheduleRouter.get(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: scheduleIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const schedule = await Schedule.findById(id)
        .populate("class", "name")
        .populate("course", "name code")
        .populate("teacher", "name email");

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json({ data: schedule });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH schedules/:id
 * @desc    Update schedule
 * @access  Admin only
 */
scheduleRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: scheduleIdSchema, body: updateScheduleSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
      const updates = req.validatedBody;

      const existing = await Schedule.findById(id);
      if (!existing) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check for conflicts if time/day/class is being updated
      if (
        updates.day ||
        updates.start_time ||
        updates.end_time ||
        updates.class
      ) {
        const conflict = await hasTimeConflict(
          updates.class || existing.class,
          updates.day || existing.day,
          updates.start_time || existing.start_time,
          updates.end_time || existing.end_time,
          id,
        );

        if (conflict) {
          return res.status(409).json({
            message: "Update creates a time conflict",
          });
        }
      }

      const updated = await Schedule.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).populate([
        { path: "class", select: "name" },
        { path: "course", select: "name code" },
        { path: "teacher", select: "name" },
      ]);

      res.json({
        message: "Schedule updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE schedules/:id
 * @desc    Delete schedule
 * @access  Admin only
 */
scheduleRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  validate({ params: scheduleIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const deleted = await Schedule.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE schedules/class/:classId
 * @desc    Delete all schedules for a class (clear timetable)
 * @access  Admin only
 */
scheduleRouter.delete(
  "/class/:classId",
  protect,
  authorize("admin"),
  validate({ params: classSchedulesSchema }),
  async (req, res) => {
    try {
      const { classId } = req.validatedParams;

      const result = await Schedule.deleteMany({ class: classId });

      res.json({
        message: `Deleted ${result.deletedCount} schedules for class`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { scheduleRouter };
