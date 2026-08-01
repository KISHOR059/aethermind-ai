import { Router } from "express";
import type { Router as RouterType } from "express";

import healthRouter from "./health.routes.js";

const apiRouter: RouterType = Router();

apiRouter.use(healthRouter);

export default apiRouter;
