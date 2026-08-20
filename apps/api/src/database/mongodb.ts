import mongoose from "mongoose";
import type { ConnectOptions } from "mongoose";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

export const MONGOOSE_SERVERLESS_OPTIONS: ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

/**
 * Connect to MongoDB with serverless connection and promise caching.
 * Reuses existing healthy connection (readyState === 1) or in-flight promise.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  // 1. Return existing healthy connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  // 2. Return in-flight connection promise if already connecting
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      cached.promise = null;
      cached.conn = null;
      throw error;
    }
  }

  // 3. Initiate new connection attempt
  cached.conn = null;
  cached.promise = mongoose.connect(env.MONGODB_URI, MONGOOSE_SERVERLESS_OPTIONS);

  try {
    cached.conn = await cached.promise;
    logger.info("MongoDB connection established");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    logger.error("MongoDB connection failed", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    throw error;
  }
}

/**
 * Gracefully close the MongoDB connection and clear cache.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  cached.conn = null;
  cached.promise = null;
}

/**
 * Helper to inspect current connection readiness.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Access the cached connection state (for telemetry and test assertions).
 */
export function getMongooseCache(): MongooseCache {
  return cached;
}

