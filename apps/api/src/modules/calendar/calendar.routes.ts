import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { calendarController } from "./calendar.container.js";
import { calendarQuerySchema } from "./calendar.validation.js";
import { taskRescheduleSchema } from "../tasks/task.validation.js";

const calendarRouter: RouterType = Router();

calendarRouter.get(
  "/",
  requireAuth,
  validateQuery(calendarQuerySchema),
  asyncHandler(calendarController.getEvents),
);

calendarRouter.post(
  "/reschedule",
  requireAuth,
  validateBody(taskRescheduleSchema),
  asyncHandler(calendarController.reschedule),
);

export default calendarRouter;
