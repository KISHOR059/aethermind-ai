import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import { activityService } from "./activity.service.js";

export class ActivityController {
  public getFeed = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 20;

    const result = await activityService.getActivityFeed(request.user.id, page, limit);

    successResponse(response, result, "Activity feed retrieved successfully");
  };
}

export const activityController = new ActivityController();
