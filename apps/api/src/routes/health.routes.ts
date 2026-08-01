import { Router } from "express";
import type { Router as RouterType } from "express";

import { getHealth } from "../controllers/health.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const healthRouter: RouterType = Router();

healthRouter.get("/health", asyncHandler(getHealth));

export default healthRouter;
