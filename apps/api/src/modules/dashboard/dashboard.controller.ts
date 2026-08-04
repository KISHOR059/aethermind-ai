import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import type { DashboardService } from "./dashboard.service.js";

export class DashboardController {
  public constructor(private readonly dashboardService: DashboardService) {}

  public getStats = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const stats = await this.dashboardService.getStatistics(request.user.id);

    successResponse(
      response,
      stats,
      "Dashboard statistics retrieved successfully",
    );
  };
}
