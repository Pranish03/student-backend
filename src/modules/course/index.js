import { Router } from "express";
import { Course } from "./model.js";
import { protect } from "../../middlewares/protect.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { createCourseSchema } from "./schema";

const courseRouter = Router();

/**
 * @DESC   Create course endpoint
 * @PATH   POST course/
 * @ACCESS Admin only
 */
courseRouter.post(
  "/",
  protect,
  authorize("admin"),
  validate({ body: createCourseSchema }),
  async (req, res) => {
    try {
      const data = req.validatedBody;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
