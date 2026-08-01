import { Router } from "express";
import type { Router as RouterType } from "express";

import { asyncHandler } from "../../utils/async-handler.js";
import { aiController } from "./index.js";

const aiRouter: RouterType = Router();

aiRouter.get("/health", asyncHandler(aiController.health));

export default aiRouter;
