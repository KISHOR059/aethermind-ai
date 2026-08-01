import { Router } from "express";
import type { Router as RouterType } from "express";

import { validateBody } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authController } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import {
  loginSchema,
  registerSchema,
} from "./auth.validation.js";

const authRouter: RouterType = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(authController.login),
);
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));

export default authRouter;
