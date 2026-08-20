import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { FilterQuery } from "mongoose";

import app from "../../../app.js";
import { env } from "../../../config/env.js";
import { logger } from "../../../lib/logger.js";
import { NotificationModel, type Notification } from "../notification.model.js";
import { TaskModel, TaskStatus, type TaskDocument } from "../../tasks/task.model.js";
import { UserModel, type UserDocument } from "../../auth/user.model.js";
import { reminderScheduler } from "./reminder.scheduler.js";
import * as reminderEngine from "./reminder.engine.js";

describe("Serverless Reminder Cron Endpoint", () => {
  const validCronSecret = env.CRON_SECRET || "dev-cron-secret-local-testing-only";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects requests missing the authorization header with 401", async () => {
    const response = await request(app).get("/api/v1/notifications/reminders/run");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("authorization");
  });

  it("rejects requests with an invalid cron secret with 401", async () => {
    const response = await request(app)
      .post("/api/v1/notifications/reminders/run")
      .set("Authorization", "Bearer incorrect-secret-12345");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("authorization");
  });

  it("rejects normal user JWT tokens on cron endpoint with 401", async () => {
    const response = await request(app)
      .post("/api/v1/notifications/reminders/run")
      .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("accepts valid CRON_SECRET via GET and executes runOnce without calling start()", async () => {
    const runOnceSpy = vi.spyOn(reminderScheduler, "runOnce").mockResolvedValue({
      status: "completed",
      executedAt: new Date().toISOString(),
      totalChecks: 5,
      successfulChecks: 5,
      failedChecks: 0,
      checks: [
        { name: "overdue-tasks", status: "success" },
        { name: "due-today-tasks", status: "success" },
        { name: "due-tomorrow-tasks", status: "success" },
        { name: "weekly-review", status: "success" },
        { name: "productivity-milestones", status: "success" },
      ],
    });
    const startSpy = vi.spyOn(reminderScheduler, "start");

    const response = await request(app)
      .get("/api/v1/notifications/reminders/run")
      .set("Authorization", `Bearer ${validCronSecret}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("completed");
    expect(response.body.data.totalChecks).toBe(5);
    expect(runOnceSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).not.toHaveBeenCalled();
  });

  it("accepts valid CRON_SECRET via POST and executes runOnce without calling start()", async () => {
    const runOnceSpy = vi.spyOn(reminderScheduler, "runOnce").mockResolvedValue({
      status: "completed",
      executedAt: new Date().toISOString(),
      totalChecks: 5,
      successfulChecks: 5,
      failedChecks: 0,
      checks: [],
    });
    const startSpy = vi.spyOn(reminderScheduler, "start");

    const response = await request(app)
      .post("/api/v1/notifications/reminders/run")
      .set("Authorization", `Bearer ${validCronSecret}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(runOnceSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).not.toHaveBeenCalled();
  });

  it("never logs the CRON_SECRET on success or error", async () => {
    vi.spyOn(reminderScheduler, "runOnce").mockResolvedValue({
      status: "completed",
      executedAt: new Date().toISOString(),
      totalChecks: 5,
      successfulChecks: 5,
      failedChecks: 0,
      checks: [],
    });

    const loggerInfoSpy = vi.spyOn(logger, "info");
    const loggerErrorSpy = vi.spyOn(logger, "error");

    await request(app)
      .get("/api/v1/notifications/reminders/run")
      .set("Authorization", `Bearer ${validCronSecret}`);

    await request(app)
      .get("/api/v1/notifications/reminders/run")
      .set("Authorization", "Bearer wrong-secret-to-test-leakage");

    for (const call of [...loggerInfoSpy.mock.calls, ...loggerErrorSpy.mock.calls]) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain(validCronSecret);
      expect(serialized).not.toContain("wrong-secret-to-test-leakage");
    }
  });

  it("prevents duplicate notifications across sequential cron executions (idempotency)", async () => {
    const mockUserId = "507f1f77bcf86cd799439011";

    // Mock active users query chain
    vi.spyOn(UserModel, "find").mockImplementation(() => {
      return {
        select: () => ({
          lean: () => ({
            exec: vi.fn().mockResolvedValue([{ _id: mockUserId }]),
          }),
        }),
      } as unknown as ReturnType<typeof UserModel.find>;
    });

    // Mock overdue tasks query chain
    vi.spyOn(TaskModel, "find").mockImplementation(() => {
      return {
        lean: () => ({
          exec: vi.fn().mockResolvedValue([
            {
              _id: "507f1f77bcf86cd799439099",
              title: "Overdue Migration Task",
              status: TaskStatus.TODO,
              owner: mockUserId,
              dueDate: new Date(Date.now() - 86400000),
            },
          ] as unknown as TaskDocument[]),
        }),
      } as unknown as ReturnType<typeof TaskModel.find>;
    });

    // In-memory array tracking created notifications
    interface InMemoryNotification {
      userId: string;
      title: string;
      message: string;
      metadata?: { reminderId?: string };
    }
    const existingNotifications: InMemoryNotification[] = [];

    vi.spyOn(NotificationModel, "findOne").mockImplementation((query?: FilterQuery<Notification>) => {
      const queryObj = query as { userId?: string; "metadata.reminderId"?: string };
      return {
        lean: () => ({
          exec: vi.fn().mockImplementation(async () => {
            const found = existingNotifications.find(
              (n) =>
                n.userId === queryObj?.userId &&
                n.metadata?.reminderId === queryObj?.["metadata.reminderId"],
            );
            return found || null;
          }),
        }),
      } as unknown as ReturnType<typeof NotificationModel.findOne>;
    });

    const createSpy = vi
      .spyOn(NotificationModel, "create")
      .mockImplementation(async (docs: unknown) => {
        const item = docs as InMemoryNotification;
        existingNotifications.push(item);
        return item as unknown as UserDocument;
      });

    // First execution creates notification
    await reminderEngine.checkOverdueTasks();
    expect(createSpy).toHaveBeenCalledTimes(1);

    // Second execution skips duplicate notification
    await reminderEngine.checkOverdueTasks();
    expect(createSpy).toHaveBeenCalledTimes(1);
  });
});
