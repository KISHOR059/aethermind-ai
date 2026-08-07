import type { Request, Response } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { paginatedResponse, successResponse } from "../../utils/response.js";
import type { NotificationService } from "./notification.service.js";
import type { NotificationListQueryOutput } from "./notification.validation.js";

export class NotificationController {
  public constructor(private readonly service: NotificationService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const query = request.query as unknown as NotificationListQueryOutput;
    const result = await this.service.list(request.user.id, query);

    paginatedResponse(
      response,
      result.items,
      {
        page: query.pagination.page,
        limit: query.pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pagination.limit),
      },
      "Notifications retrieved successfully",
    );
  };

  public getUnreadCount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.service.getUnreadCount(request.user.id);

    successResponse(response, result, "Unread count retrieved successfully");
  };

  public markAsRead = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const notificationId = request.params.id;
    if (typeof notificationId !== "string") {
      throw new Error("Invalid notification ID");
    }

    const notification = await this.service.markAsRead(request.user.id, notificationId);

    successResponse(response, notification, "Notification marked as read");
  };

  public markAllAsRead = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const result = await this.service.markAllAsRead(request.user.id);

    successResponse(
      response,
      result,
      `${result.modifiedCount} notifications marked as read`,
    );
  };

  public delete = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const notificationId = request.params.id;
    if (typeof notificationId !== "string") {
      throw new Error("Invalid notification ID");
    }

    await this.service.delete(request.user.id, notificationId);

    successResponse(response, null, "Notification deleted successfully");
  };
}
