import { Router } from "express";
import type { Router as RouterType } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { aiController } from "./index.js";

const aiRouter: RouterType = Router();

aiRouter.get("/health", asyncHandler(aiController.health));
aiRouter.post(
  "/plan-day",
  requireAuth,
  asyncHandler(aiController.planDay),
);
aiRouter.post(
  "/tasks/:taskId/breakdown",
  requireAuth,
  asyncHandler(aiController.breakDownTask),
);
aiRouter.post(
  "/prioritize",
  requireAuth,
  asyncHandler(aiController.prioritizeTasks),
);
aiRouter.post(
  "/reschedule",
  requireAuth,
  asyncHandler(aiController.smartReschedule),
);
aiRouter.post(
  "/weekly-review",
  requireAuth,
  asyncHandler(aiController.weeklyReview),
);

export default aiRouter;
