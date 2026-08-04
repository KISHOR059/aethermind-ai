import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { dashboardController } from "./index.js";

const dashboardRouter: RouterType = Router();

dashboardRouter.get(
  "/stats",
  requireAuth,
  asyncHandler(dashboardController.getStats),
);

export default dashboardRouter;
