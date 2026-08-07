import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { validateQuery } from "../../middlewares/validate.middleware.js";
import { calendarController } from "./calendar.container.js";
import { calendarQuerySchema } from "./calendar.validation.js";

const calendarRouter: RouterType = Router();

calendarRouter.get(
  "/",
  requireAuth,
  validateQuery(calendarQuerySchema),
  asyncHandler(calendarController.getEvents),
);

export default calendarRouter;
