import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createServer } from "node:http";

import * as databaseModule from "./database/mongodb.js";
import { app, serverlessHandler } from "./serverless.js";

describe("Serverless Express API Entrypoint", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports serverlessHandler and app cleanly", () => {
    expect(serverlessHandler).toBeTypeOf("function");
    expect(app).toBeDefined();
    expect(app.listen).toBeTypeOf("function");
  });

  it("never calls app.listen when imported or invoked", async () => {
    const listenSpy = vi.spyOn(app, "listen");
    vi.spyOn(databaseModule, "connectDatabase").mockResolvedValue({} as never);

    const testServer = createServer((req, res) => {
      void serverlessHandler(req, res);
    });

    const res = await request(testServer).get("/api/v1/health");

    expect(listenSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("invokes connectDatabase before processing requests", async () => {
    const connectSpy = vi
      .spyOn(databaseModule, "connectDatabase")
      .mockResolvedValue({} as never);

    const testServer = createServer((req, res) => {
      void serverlessHandler(req, res);
    });

    const response = await request(testServer).get("/api/v1/health");

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns HTTP 500 when database connection fails in serverless handler", async () => {
    vi.spyOn(databaseModule, "connectDatabase").mockRejectedValueOnce(
      new Error("MongoDB cluster unreachable"),
    );

    const testServer = createServer((req, res) => {
      void serverlessHandler(req, res);
    });

    const response = await request(testServer).get("/api/v1/health");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Database connection failed");
  });

  it("routes /api/v1/health successfully via Express app", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe("aethermind-api");
    expect(response.body.data.version).toBe("1.0.0");
  });
});
