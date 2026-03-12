import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { validate } from "../../middlewares/validate.js";
import { authorize } from "../../middlewares/authorize.js";
import {
  createSubmissionSchema,
  editSubmissionSchema,
  submissionParamsSchema,
} from "./schema.js";
import { Submission } from "./model.js";
import { Resource } from "../resource/model.js";
import { upload } from "../../lib/multer.js";
import cloudinary from "../../lib/cloudinary";

const submissionRouter = Router();

/**
 * @route   POST submissions/
 * @desc    Create an assignment submission
 * @access  Student only
 * @params  None
 * @returns 201 - Assignment submitted successfully
 *          400 - Submission already exists
 *          500 - Internal server error
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

      const assignment = await Resource.findOne({
        _id: data.assignment,
        type: "assignment",
      });

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const existingSubmission = await Submission.findOne({
        assignment: data.assignment,
        student: student,
      });

      if (existingSubmission) {
        return res.status(400).json({
          message: "You have already submitted this assignment",
        });
      }

      const fileUrl = req.file?.path;

      const submission = await Submission.create({
        assignment: data.assignment,
        student: student,
        file: fileUrl,
      });

      await submission.populate("assignment", "title description");

      res.status(201).json({
        message: "Assignment submitted successfully",
        data: submission,
      });
    } catch (error) {
      console.error("Create submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET submissions/assignment/:id
 * @desc    Get submission by assignment id
 * @access  Teacher only
 * @params  None
 * @returns 200 - Submission data
 *          500 - Internal server error
 */
submissionRouter.get(
  "/assignment/:id",
  protect,
  authorize("teacher"),
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
 * @params  id - Resource ID (MongoDB ObjectID)
 * @returns 200 - Submission data
 *          404 - Submission doesn't exist
 *          500 - Internal server error
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
 * @desc    Update submission by submission id
 * @access  Student only
 * @params  id - Resource ID (MongoDB ObjectID)
 * @returns 200 - Assignment resubmitted successfully
 *          404 - Submission doesn't exist
 *          500 - Internal server error
 */
submissionRouter.patch(
  "/:id",
  protect,
  authorize("student"),
  upload.single("file"),
  validate({ body: editSubmissionSchema, params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const submissionId = req.validatedParams.id;

      const data = req.validatedBody;

      const submission = await Submission.findById(submissionId);

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (submission.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only update your own submissions",
        });
      }

      if (req.file) {
        if (submission.file) {
          try {
            const publicId = submission.file
              .split("/upload/")[1]
              ?.split(".")[0];

            if (publicId) {
              await cloudinary.uploader.destroy(publicId, {
                resource_type: "raw",
              });
            }
          } catch (err) {
            console.error("Cloudinary delete error:", err);
          }
        }

        submission.file = req.file.path;
      }

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
 * @desc    Delete submission by submission id
 * @access  Student only
 * @params  id - Resource ID (MongoDB ObjectID)
 * @returns 200 - Assignment submission removed successfully
 *          404 - Submission doesn't exist
 *          500 - Internal server error
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
        try {
          const publicId = submission.file.split("/upload/")[1]?.split(".")[0];

          if (publicId) {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: "raw",
            });
          }
        } catch (err) {
          console.error("Cloudinary delete error:", err);
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
