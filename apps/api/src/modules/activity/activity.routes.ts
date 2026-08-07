import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { activityController } from "./activity.controller.js";

const activityRouter: RouterType = Router();

activityRouter.get("/", requireAuth, asyncHandler(activityController.getFeed));

export default activityRouter;
