import { Router } from "express";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { upload } from "../../lib/multer.js";
import { validate } from "../../middlewares/validate.js";
import {
  createResourceSchema,
  editResourceSchema,
  resourceParamsSchema,
  resourceQuerySchema,
} from "./schema.js";
import { Resource } from "./model.js";
import cloudinary from "../../lib/cloudinary.js";

const resourceRouter = Router();

/**
 * @route   POST resources/
 * @desc    Create a course resource
 * @access  Teacher only
 * @params  None
 * @returns 201 - Resource added successfully
 *          400 - Resource already exists
 *          500 - Internal server error
 */
resourceRouter.post(
  "/",
  protect,
  authorize("teacher"),
  upload.single("file"),
  validate({ body: createResourceSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      const resourceExist = await Resource.findOne({ title });

      if (resourceExist) {
        return res.status(400).json({
          message: "Resource with this title already exists in this course",
        });
      }

      const fileUrl = req.file?.path;

      if (data.type === "assignment" && !data.deadline) {
        return res.status(400).json({
          message: "Deadline is required for assignments",
        });
      }

      const resource = await Resource.create({
        ...data,
        file: fileUrl,
      });

      return res.status(201).json({
        message: "Resource created successfully",
        resource,
      });
    } catch (error) {
      console.error("Create resource error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET resources/:id?type=resource_type
 * @desc    Get resources by course id and resource type
 * @access  Teacher & Student only
 * @params  none
 * @returns 200 - Course resource data
 *          404 - No resource found
 *          500 - Internal server error
 */
resourceRouter.get(
  "/",
  protect,
  authorize("teacher", "student"),
  validate({ query: resourceQuerySchema, params: resourceParamsSchema }),
  async (req, res) => {
    try {
      const resourceType = req.validatedQuery.type;

      const courseId = req.validatedParams.id;

      const resources = await Resource.find({
        course: courseId,
        type: resourceType,
      }).sort({ createdAt: -1 });

      if (!resources || resources.length === 0) {
        return res.status(404).json({
          message: "No resources found for this course",
        });
      }

      return res.status(200).json({
        message: "Resources retrieved successfully",
        resources,
      });
    } catch (error) {
      console.error("Get resource error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET resources/:id
 * @desc    Get resources by resource id
 * @access  Teacher & Student only
 * @params  none
 * @returns 200 - Course resource data
 *          404 - No resource found
 *          500 - Internal server error
 */
resourceRouter.get(
  "/:id",
  protect,
  authorize("teacher", "student"),
  validate({ params: resourceParamsSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const resource = await Resource.findById(id).populate(
        "course",
        "title code",
      );

      if (!resource) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      return res.status(200).json({
        message: "Resource retrieved successfully",
        resource,
      });
    } catch (error) {
      console.error("Get resource by id error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   UPDATE resources/:id
 * @desc    Update resource by resource id
 * @access  Teacher only
 * @params  id - Resource ID (MongoDB ObjectID)
 * @returns 200 - Resource updated successfully
 *          404 - No resource found
 *          500 - Internal server error
 */
resourceRouter.patch(
  "/:id",
  protect,
  authorize("teacher"),
  upload.single("file"),
  validate({ params: resourceParamsSchema, body: editResourceSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;

      const data = req.validatedBody;
    } catch (error) {
      console.error("Update resource error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   DELETE resources/:id
 * @desc    Delete resource by resource id
 * @access  Teacher only
 * @params  id - Resource ID (MongoDB ObjectID)
 * @returns 200 - Resource deleted successfully
 *          404 - No resource found
 *          500 - Internal server error
 */
resourceRouter.delete(
  "/:id",
  protect,
  authorize("teacher"),
  validate({ params: resourceParamsSchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
    } catch (error) {
      console.error("Delete resource error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { resourceRouter };
