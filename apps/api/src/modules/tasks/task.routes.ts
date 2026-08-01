import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { taskController } from "./task.controller.js";
import {
  createTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from "./task.validation.js";

const taskRouter: RouterType = Router();

taskRouter.use(requireAuth);
taskRouter.post("/", validateBody(createTaskSchema), asyncHandler(taskController.create));
taskRouter.get("/", validateQuery(taskListQuerySchema), asyncHandler(taskController.list));
taskRouter.get("/:id", asyncHandler(taskController.getById));
taskRouter.patch("/:id", validateBody(updateTaskSchema), asyncHandler(taskController.update));
taskRouter.delete("/:id", asyncHandler(taskController.remove));

export default taskRouter;
