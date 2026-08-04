import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import type { AiService } from "./ai.service.js";

export class AiController {
  public constructor(private readonly aiService: AiService) {}

  public health = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    successResponse(
      response,
      this.aiService.getHealth(),
      "AI service is available",
    );
  };

  public planDay = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.planDay(request.user.id);

    successResponse(response, result, "Daily plan generated successfully");
  };

  public breakDownTask = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const taskId = request.params.taskId as string;
    const result = await this.aiService.breakDownTask(taskId, request.user.id);

    successResponse(response, result, "Task breakdown generated successfully");
  };

  public prioritizeTasks = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.prioritizeTasks(request.user.id);

    successResponse(
      response,
      result,
      "Task prioritization generated successfully",
    );
  };

  public smartReschedule = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.smartReschedule(request.user.id);

    successResponse(
      response,
      result,
      "Smart reschedule generated successfully",
    );
  };

  public weeklyReview = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.weeklyReview(request.user.id);

    successResponse(
      response,
      result,
      "Weekly review generated successfully",
    );
  };

  public productivityInsights = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.aiService.productivityInsights(request.user.id);

    successResponse(
      response,
      result,
      "Productivity insights generated successfully",
    );
  };
}





