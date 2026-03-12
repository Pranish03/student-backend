import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { validate } from "../../middlewares/validate.js";
import { authorize } from "../../middlewares/authorize.js";
import {
  createSubmissionSchema,
  editSubmissionSchema,
  submissionParamsSchema,
} from "./schema.js";

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
  validate({ body: createSubmissionSchema }),
  async (req, res) => {
    try {
      const user = req.user._id;
      const data = req.validatedBody;
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
 * @returns 201 - Submission data
 *          400 - Submission doesn't exists
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
 * @returns 201 - Assignment resubmitted successfully
 *          400 - Submission doesn't exists
 *          500 - Internal server error
 */
submissionRouter.patch(
  "/:id",
  protect,
  authorize("student"),
  validate({ body: editSubmissionSchema, params: submissionParamsSchema }),
  async (req, res) => {
    try {
      const submissionId = req.validatedParams.id;
      const data = req.validatedBody;
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
 * @returns 201 - Assignment submission removed successfully
 *          400 - Submission doesn't exists
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
    } catch (error) {
      console.error("Delete submission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { submissionRouter };
