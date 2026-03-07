import { Router } from "express";
import { Schedule } from "./model.js";
import { Class } from "../class/model.js";
import { Course } from "../course/model.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  scheduleIdSchema,
  createScheduleSchema,
  updateScheduleSchema,
  scheduleByClassSchema,
  addTimeTableEntrySchema,
  updateTimeTableEntrySchema,
  timeTableParamsSchema,
} from "./schema.js";

const scheduleRouter = Router();

const hasTimeConflict = (timeTable, newEntry, ignoreEntryId = null) => {
  return timeTable.some((existing) => {
    if (ignoreEntryId && existing._id.toString() === ignoreEntryId)
      return false;

    if (existing.day !== newEntry.day) return false;

    return (
      newEntry.startTime < existing.endTime &&
      newEntry.endTime > existing.startTime
    );
  });
};

/**
 * @route   POST schedules/
 * @desc    Create a new schedule for a class
 * @access  Admin only
 */
scheduleRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createScheduleSchema }),
  async (req, res) => {
    try {
      const { class: classId, timeTable } = req.validatedBody;

      const classExists = await Class.findById(classId);

      if (!classExists) {
        return res.status(404).json({ message: "Class does not exist" });
      }

      const scheduleExists = await Schedule.findOne({ class: classId });

      if (scheduleExists) {
        return res
          .status(409)
          .json({ message: "Schedule already exists for this class" });
      }

      if (timeTable && timeTable.length > 0) {
        const courseIds = timeTable.map((entry) => entry.course);

        const courses = await Course.find({ _id: { $in: courseIds } });

        if (courses.length !== courseIds.length) {
          return res
            .status(404)
            .json({ message: "One or more courses do not exist" });
        }

        for (const entry of timeTable) {
          if (entry.startTime >= entry.endTime) {
            return res.status(400).json({
              message: `Start time must be before end time for course on ${entry.day}`,
            });
          }

          if (hasTimeConflict(timeTable, entry)) {
            return res.status(409).json({
              message: `Time conflict detected on ${entry.day}`,
            });
          }
        }
      }

      const schedule = await Schedule.create({ class: classId, timeTable });

      await schedule.populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      return res
        .status(201)
        .json({ message: "Schedule created successfully", data: schedule });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET schedules/
 * @desc    Get all schedules
 * @access  All except guest
 */
scheduleRouter.get("/", protect, async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: schedules,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET schedules/:id
 * @desc    Get schedule by id
 * @access  All except guests
 */
scheduleRouter.get(
  "/:id",
  protect,
  validate({ params: scheduleIdSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const schedule = await Schedule.findById(id).populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      return res.status(200).json({ data: schedule });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET schedules/class/:classId
 * @desc    Get schedule by class id
 * @access  All except guests
 */
scheduleRouter.get(
  "/class/:classId",
  protect,
  validate({ params: scheduleByClassSchema }),
  async (req, res) => {
    try {
      const { classId } = req.validatedParams;

      const schedule = await Schedule.findOne({ class: classId }).populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      if (!schedule) {
        return res
          .status(404)
          .json({ message: "Schedule not found for this class" });
      }

      return res.status(200).json({ data: schedule });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH schedules/:id
 * @desc    Update schedule (replace entire timetable)
 * @access  Admin only
 */
scheduleRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate({ body: updateScheduleSchema, params: scheduleIdSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const { id } = req.validatedParams;

      if (data.class) {
        const classExists = await Class.findById(data.class);
        if (!classExists) {
          return res.status(404).json({ message: "Class does not exist" });
        }

        const scheduleExists = await Schedule.findOne({
          class: data.class,
          _id: { $ne: id },
        });

        if (scheduleExists) {
          return res.status(409).json({
            message: "Schedule already exists for this class",
          });
        }
      }

      if (data.timeTable && data.timeTable.length > 0) {
        const courseIds = data.timeTable.map((entry) => entry.course);

        const courses = await Course.find({ _id: { $in: courseIds } });

        if (courses.length !== courseIds.length) {
          return res
            .status(404)
            .json({ message: "One or more courses do not exist" });
        }

        for (const entry of data.timeTable) {
          if (entry.startTime >= entry.endTime) {
            return res.status(400).json({
              message: `Start time must be before end time for course on ${entry.day}`,
            });
          }

          if (hasTimeConflict(data.timeTable, entry)) {
            return res.status(409).json({
              message: `Time conflict detected on ${entry.day}`,
            });
          }
        }
      }

      const schedule = await Schedule.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      return res
        .status(200)
        .json({ message: "Schedule updated successfully", data: schedule });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   POST schedules/:id/entries
 * @desc    Add timetable entry to schedule
 * @access  Admin only
 */
scheduleRouter.post(
  "/:id/entries",
  protect,
  authorize("admin"),
  validate({ body: addTimeTableEntrySchema, params: scheduleIdSchema }),
  async (req, res) => {
    try {
      const entry = req.validatedBody;

      const { id } = req.validatedParams;

      const courseExists = await Course.findById(entry.course);

      if (!courseExists) {
        return res.status(404).json({ message: "Course does not exist" });
      }

      if (entry.startTime >= entry.endTime) {
        return res.status(400).json({
          message: "Start time must be before end time",
        });
      }

      const schedule = await Schedule.findById(id);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      if (hasTimeConflict(schedule.timeTable, entry)) {
        return res.status(409).json({
          message: "Time conflict with existing timetable entry",
        });
      }

      schedule.timeTable.push(entry);

      await schedule.save();

      await schedule.populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      return res.status(200).json({
        message: "Timetable entry added successfully",
        data: schedule,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH schedules/:id/entries/:entryId
 * @desc    Update specific timetable entry
 * @access  Admin only
 */
scheduleRouter.patch(
  "/:id/entries/:entryId",
  protect,
  authorize("admin"),
  validate({
    body: updateTimeTableEntrySchema,
    params: timeTableParamsSchema,
  }),
  async (req, res) => {
    try {
      const updates = req.validatedBody;

      const { id, entryId } = req.validatedParams;

      if (updates.course) {
        const courseExists = await Course.findById(updates.course);

        if (!courseExists) {
          return res.status(404).json({ message: "Course does not exist" });
        }
      }

      const schedule = await Schedule.findById(id);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      const entry = schedule.timeTable.id(entryId);

      if (!entry) {
        return res.status(404).json({ message: "Timetable entry not found" });
      }

      Object.assign(entry, updates);

      if (entry.startTime >= entry.endTime) {
        return res.status(400).json({
          message: "Start time must be before end time",
        });
      }

      if (hasTimeConflict(schedule.timeTable, entry, entryId)) {
        return res.status(409).json({
          message: "Time conflict with another timetable entry",
        });
      }

      await schedule.save();
      await schedule.populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      return res.status(200).json({
        message: "Timetable entry updated successfully",
        data: schedule,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE schedules/:id/entries/:entryId
 * @desc    Remove timetable entry from schedule
 * @access  Admin only
 */
scheduleRouter.delete(
  "/:id/entries/:entryId",
  protect,
  authorize("admin"),
  validate({ params: timeTableParamsSchema }),
  async (req, res) => {
    try {
      const { id, entryId } = req.validatedParams;

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      schedule.timeTable.id(entryId)?.deleteOne();

      await schedule.save();
      await schedule.populate([
        { path: "class", select: "name section" },
        { path: "timeTable.course", select: "name code" },
      ]);

      return res.status(200).json({
        message: "Timetable entry removed successfully",
        data: schedule,
      });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE schedules/:id
 * @desc    Delete schedule by id
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

      const schedule = await Schedule.findByIdAndDelete(id);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      return res.status(200).json({ message: "Schedule deleted successfully" });
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { scheduleRouter };
