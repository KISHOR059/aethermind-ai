import type { Request, Response } from "express";

import { UnauthorizedError, ValidationError } from "../../utils/app-error.js";
import { createdResponse, paginatedResponse, successResponse } from "../../utils/response.js";
import { taskService } from "./task.container.js";
import type {
  CreateTaskInput,
  TaskListQueryInput,
  UpdateTaskInput,
} from "./task.validation.js";

function getAuthenticatedUser(request: Request) {
  if (!request.user) {
    throw new UnauthorizedError("Authenticated user is required");
  }

  return request.user;
}

function getTaskId(request: Request): string {
  const taskId = request.params.id;

  if (typeof taskId !== "string") {
    throw new ValidationError("A valid task ID is required");
  }

  return taskId;
}

export class TaskController {
  public create = async (request: Request, response: Response): Promise<void> => {
    const task = await taskService.create(
      getAuthenticatedUser(request),
      request.body as CreateTaskInput,
    );

    createdResponse(response, { task }, "Task created successfully");
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await taskService.list(
      getAuthenticatedUser(request),
      request.query as unknown as TaskListQueryInput,
    );

    paginatedResponse(
      response,
      result.items,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pagination.limit),
      },
      "Tasks retrieved successfully",
    );
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const task = await taskService.getById(
      getAuthenticatedUser(request),
      getTaskId(request),
    );

    successResponse(response, { task }, "Task retrieved successfully");
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const task = await taskService.update(
      getAuthenticatedUser(request),
      getTaskId(request),
      request.body as UpdateTaskInput,
    );

    successResponse(response, { task }, "Task updated successfully");
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await taskService.remove(getAuthenticatedUser(request), getTaskId(request));
    successResponse(response, {}, "Task deleted successfully");
  };
}

export const taskController = new TaskController();
