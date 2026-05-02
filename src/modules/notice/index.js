import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../lib/multer.js";
import {
  createNoticeSchema,
  updateNoticeSchema,
  noticeIdSchema,
  noticeQuerySchema,
} from "./schema.js";
import { Notice } from "./model.js";
import fs from "fs";

const noticeRouter = Router();

/**
 * @route   POST /notices
 * @desc    Create a notice
 * @access  Admin & Teacher only
 */
noticeRouter.post(
  "/",
  protect,
  authorize("admin", "teacher"),
  upload.single("file"),
  validate({ body: createNoticeSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const fileUrl = req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
        : undefined;

      const notice = await Notice.create({
        ...data,
        file: fileUrl,
        postedBy: req.user._id,
      });

      await notice.populate("postedBy", "name email role");
      if (notice.course) {
        await notice.populate("course", "name code");
      }

      return res.status(201).json({
        message: "Notice created successfully",
        data: notice,
      });
    } catch (error) {
      console.error("Create notice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET /notices
 * @desc    Get all notices (filtered by role visibility)
 * @access  All authenticated users
 */
noticeRouter.get(
  "/",
  protect,
  validate({ query: noticeQuerySchema }),
  async (req, res) => {
    try {
      const { targetRole, course } = req.validatedQuery;

      const filter = {};

      if (req.user.role === "student") {
        filter.targetRole = { $in: ["all", "student"] };
      } else if (req.user.role === "teacher") {
        filter.$or = [
          { targetRole: { $in: ["all", "teacher"] } },
          { postedBy: req.user._id },
        ];
      }

      if (req.user.role === "admin" && targetRole) {
        filter.targetRole = targetRole;
      }

      if (course) {
        filter.course = course;
      }

      const notices = await Notice.find(filter)
        .populate("postedBy", "name email role")
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Notices retrieved successfully",
        data: notices,
      });
    } catch (error) {
      console.error("Get notices error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET /notices/:id
 * @desc    Get a single notice by id
 * @access  All authenticated users
 */
noticeRouter.get(
  "/:id",
  protect,
  validate({ params: noticeIdSchema }),
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.validatedParams.id)
        .populate("postedBy", "name email role")
        .populate("course", "name code");

      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      return res.status(200).json({ data: notice });
    } catch (error) {
      console.error("Get notice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH /notices/:id
 * @desc    Update a notice
 * @access  Admin & Teacher (only own notices for teachers)
 */
noticeRouter.patch(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  upload.single("file"),
  validate({ params: noticeIdSchema, body: updateNoticeSchema }),
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.validatedParams.id);

      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Teachers can only edit their own notices
      if (
        req.user.role === "teacher" &&
        notice.postedBy.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only edit your own notices" });
      }

      const updates = { ...req.validatedBody };

      if (req.file) {
        // Delete old file if exists
        if (notice.file) {
          const oldPath = notice.file.split("/uploads/")[1];
          if (oldPath) {
            fs.unlink(`uploads/${oldPath}`, (err) => {
              if (err) console.error("File delete error:", err);
            });
          }
        }
        updates.file = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
      }

      const updated = await Notice.findByIdAndUpdate(
        req.validatedParams.id,
        updates,
        { new: true, runValidators: true },
      )
        .populate("postedBy", "name email role")
        .populate("course", "name code");

      return res.status(200).json({
        message: "Notice updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update notice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE /notices/:id
 * @desc    Delete a notice
 * @access  Admin & Teacher (only own notices for teachers)
 */
noticeRouter.delete(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  validate({ params: noticeIdSchema }),
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.validatedParams.id);

      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Teachers can only delete their own notices
      if (
        req.user.role === "teacher" &&
        notice.postedBy.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete your own notices" });
      }

      // Delete attached file if exists
      if (notice.file) {
        const oldPath = notice.file.split("/uploads/")[1];
        if (oldPath) {
          fs.unlink(`uploads/${oldPath}`, (err) => {
            if (err) console.error("File delete error:", err);
          });
        }
      }

      await notice.deleteOne();

      return res.status(200).json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Delete notice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { noticeRouter };
