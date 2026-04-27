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
import fs from "fs";

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

      const resourceExist = await Resource.exists({
        title: data.title,
        course: data.course,
      });

      if (resourceExist) {
        return res.status(400).json({
          message: "Resource with this title already exists in this course",
        });
      }

      const fileUrl = req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
        : undefined;

      const resource = await Resource.create({
        ...data,
        file: fileUrl,
      });

      res.status(201).json({
        message: "Resource created successfully",
        resource,
      });
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET resources/course/:id
 * @desc    Get resources by course id
 * @access  Teacher & Student only
 * @params  None
 * @returns 200 - Course resource data
 *          404 - No resource found
 *          500 - Internal server error
 */
resourceRouter.get(
  "/course/:id",
  protect,
  authorize("teacher", "student"),
  validate({ params: resourceParamsSchema, query: resourceQuerySchema }),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
      const { type } = req.validatedQuery;

      const filter = { course: id };

      if (type) filter.type = type;

      const resources = await Resource.find(filter)
        .populate("course", "name code")
        .sort({ createdAt: -1 })
        .lean();

      if (!resources.length) {
        return res.status(404).json({
          message: "No resources found for this course",
        });
      }

      res.status(200).json({
        message: "Resources retrieved successfully",
        resources,
      });
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route   GET resources/:id
 * @desc    Get resources by resource id
 * @access  Teacher & Student only
 * @params  None
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

      const resource = await Resource.findById(id)
        .populate("course", "name code")
        .lean();

      if (!resource) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      res.status(200).json({
        message: "Resource retrieved successfully",
        resource,
      });
    } catch (error) {
      console.error("Get resource error:", error);
      res.status(500).json({ message: "Internal server error" });
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

      const updates = req.validatedBody;

      const existingResource = await Resource.findById(id);

      if (!existingResource) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      if (req.file) {
        if (existingResource.file) {
          const oldPath = existingResource.file.split("/uploads/")[1];
          if (oldPath) {
            fs.unlink(`uploads/${oldPath}`, (err) => {
              if (err) console.error("File delete error:", err);
            });
          }
        }

        updates.file = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
      }

      const updatedResource = await Resource.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        message: "Resource updated successfully",
        resource: updatedResource,
      });
    } catch (error) {
      console.error("Update resource error:", error);
      res.status(500).json({ message: "Internal server error" });
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

      const resource = await Resource.findById(id);

      if (!resource) {
        return res.status(404).json({
          message: "Resource not found",
        });
      }

      if (resource.file) {
        const oldPath = resource.file.split("/uploads/")[1];
        if (oldPath) {
          fs.unlink(`uploads/${oldPath}`, (err) => {
            if (err) console.error("File delete error:", err);
          });
        }
      }

      await resource.deleteOne();

      res.status(200).json({
        message: "Resource deleted successfully",
      });
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { resourceRouter };
