import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { validate } from "../../middlewares/validate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createSubmissionSchema, submissionParamsSchema } from "./schema.js";
import { Submission } from "./model.js";
import { Resource } from "../resource/model.js";
import { upload } from "../../lib/multer.js";
import fs from "fs";

const submissionRouter = Router();

/**
 * @route   POST submissions/
 * @desc    Create an assignment submission
 * @access  Student only
 */
submissionRouter.post(
  "/",
  protect,
  authorize("student"),
  upload.single("file"),
  validate({ body: createSubmissionSchema }),
  async (req, res) => {
    try {
      const student = req.user._id;
      const data = req.validatedBody;

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const assignmentExists = await Resource.exists({
        _id: data.assignment,
        type: "assignment",
      });

      if (!assignmentExists) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;

      const submission = await Submission.create({
        assignment: data.assignment,
        student,
        file: fileUrl,
      });

      await submission.populate("assignment", "title description");

      res.status(201).json({
        message: "Assignment submitted successfully",
        data: submission,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: "You have already submitted this assignment",
        });
      }

      console.error("Create submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET submissions/assignment/:id
 * @desc    Get submissions by assignment id
 * @access  Teacher & Student only
 */
submissionRouter.get(
  "/assignment/:id",
  protect,
  authorize("teacher", "student"),
  validate({ params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const assignmentId = req.validatedParams.id;

      const assignment = await Resource.findOne({
        _id: assignmentId,
        type: "assignment",
      });

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submissions = await Submission.find({ assignment: assignmentId })
        .populate("student", "name email")
        .populate("assignment", "title description")
        .sort("-createdAt");

      res.status(200).json({
        message: "Submissions retrieved successfully",
        data: submissions,
      });
    } catch (error) {
      console.error("Get submission by assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET submissions/:id
 * @desc    Get submission by submission id
 * @access  Teacher & Student only
 */
submissionRouter.get(
  "/:id",
  protect,
  authorize("student", "teacher"),
  validate({ params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const submissionId = req.validatedParams.id;

      const submission = await Submission.findById(submissionId)
        .populate("student", "name email")
        .populate("assignment", "title description");

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (
        req.user.role === "student" &&
        submission.student._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only view your own submissions",
        });
      }

      res.status(200).json({
        message: "Submission retrieved successfully",
        data: submission,
      });
    } catch (error) {
      console.error("Get submission by id error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   PATCH submissions/:id
 * @desc    Resubmit assignment
 * @access  Student only
 */
submissionRouter.patch(
  "/:id",
  protect,
  authorize("student"),
  upload.single("file"),
  validate({ params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const submissionId = req.validatedParams.id;

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const submission = await Submission.findById(submissionId);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (submission.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only update your own submissions",
        });
      }

      if (submission.file) {
        const oldPath = submission.file.split("/uploads/")[1];
        if (oldPath) {
          fs.unlink(`uploads/${oldPath}`, (err) => {
            if (err) console.error("File delete error:", err);
          });
        }
      }

      submission.file = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;

      await submission.save();

      await submission.populate("assignment", "title description");

      res.status(200).json({
        message: "Assignment resubmitted successfully",
        data: submission,
      });
    } catch (error) {
      console.error("Update submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE submissions/:id
 * @desc    Delete submission
 * @access  Student only
 */
submissionRouter.delete(
  "/:id",
  protect,
  authorize("student"),
  validate({ params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const submissionId = req.validatedParams.id;

      const submission = await Submission.findById(submissionId);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (submission.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only delete your own submissions",
        });
      }

      if (submission.file) {
        const oldPath = submission.file.split("/uploads/")[1];
        if (oldPath) {
          fs.unlink(`uploads/${oldPath}`, (err) => {
            if (err) console.error("File delete error:", err);
          });
        }
      }

      await submission.deleteOne();

      res.status(200).json({
        message: "Assignment submission removed successfully",
      });
    } catch (error) {
      console.error("Delete submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { submissionRouter };
