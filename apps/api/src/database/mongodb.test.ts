import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose, { ConnectionStates } from "mongoose";

import {
  connectDatabase,
  disconnectDatabase,
  getMongooseCache,
  isDatabaseConnected,
  MONGOOSE_SERVERLESS_OPTIONS,
} from "./mongodb.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

describe("MongoDB Serverless Connection Manager", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Reset internal cache state before each test
    const cache = getMongooseCache();
    cache.conn = null;
    cache.promise = null;

    // Reset mongoose readyState mock
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.disconnected);
    vi.spyOn(mongoose.connection, "close").mockResolvedValue();
  });

  it("establishes first connection with serverless options and caches it", async () => {
    const connectSpy = vi
      .spyOn(mongoose, "connect")
      .mockImplementation(async () => {
        vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
        return mongoose;
      });

    const conn = await connectDatabase();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenCalledWith(env.MONGODB_URI, MONGOOSE_SERVERLESS_OPTIONS);
    expect(conn).toBe(mongoose);
    expect(isDatabaseConnected()).toBe(true);

    const cache = getMongooseCache();
    expect(cache.conn).toBe(mongoose);
  });

  it("reuses an existing healthy connection without calling mongoose.connect again", async () => {
    const connectSpy = vi
      .spyOn(mongoose, "connect")
      .mockImplementation(async () => {
        vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
        return mongoose;
      });

    // First call
    await connectDatabase();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Second call on warm instance
    const secondConn = await connectDatabase();
    expect(connectSpy).toHaveBeenCalledTimes(1); // Still 1 call
    expect(secondConn).toBe(mongoose);
  });

  it("reuses in-flight promise for concurrent connection requests", async () => {
    let resolveConnection!: (value: typeof mongoose) => void;
    const slowConnectPromise = new Promise<typeof mongoose>((resolve) => {
      resolveConnection = resolve;
    });

    const connectSpy = vi
      .spyOn(mongoose, "connect")
      .mockImplementation(async () => {
        vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connecting);
        return slowConnectPromise;
      });

    // Launch Request A and Request B concurrently
    const requestA = connectDatabase();
    const requestB = connectDatabase();

    // Verify only one connect invocation was triggered
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Complete connection
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
    resolveConnection(mongoose);

    const [resultA, resultB] = await Promise.all([requestA, requestB]);

    expect(resultA).toBe(mongoose);
    expect(resultB).toBe(mongoose);
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it("resets cached promise and cached connection when connection fails", async () => {
    const dbError = new Error("MongoNetworkError: connection refused");
    vi.spyOn(mongoose, "connect").mockRejectedValueOnce(dbError);

    await expect(connectDatabase()).rejects.toThrow("MongoNetworkError: connection refused");

    const cache = getMongooseCache();
    expect(cache.promise).toBeNull();
    expect(cache.conn).toBeNull();
  });

  it("allows retry after a failed connection attempt", async () => {
    const dbError = new Error("Initial connection failed");
    const connectSpy = vi
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(dbError)
      .mockImplementationOnce(async () => {
        vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
        return mongoose;
      });

    // First attempt fails
    await expect(connectDatabase()).rejects.toThrow("Initial connection failed");

    // Second attempt succeeds and triggers a fresh connection attempt
    const conn = await connectDatabase();
    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(conn).toBe(mongoose);
    expect(isDatabaseConnected()).toBe(true);
  });

  it("reconnects if connection was disconnected", async () => {
    const connectSpy = vi
      .spyOn(mongoose, "connect")
      .mockImplementation(async () => {
        vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
        return mongoose;
      });

    await connectDatabase();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Disconnect
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.disconnected);
    await disconnectDatabase();

    // Subsequent connect calls mongoose.connect again
    await connectDatabase();
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it("never exposes MONGODB_URI in logs on success or error", async () => {
    const loggerInfoSpy = vi.spyOn(logger, "info");
    const loggerErrorSpy = vi.spyOn(logger, "error");

    vi.spyOn(mongoose, "connect").mockImplementation(async () => {
      vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.connected);
      return mongoose;
    });

    await connectDatabase();

    // Verify info logs do not contain MONGODB_URI
    for (const call of loggerInfoSpy.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain(env.MONGODB_URI);
    }

    // Trigger error
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(ConnectionStates.disconnected);
    await disconnectDatabase();

    vi.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("Timeout"));

    await expect(connectDatabase()).rejects.toThrow("Timeout");

    // Verify error logs do not contain MONGODB_URI
    for (const call of loggerErrorSpy.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain(env.MONGODB_URI);
    }
  });
});
