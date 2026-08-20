import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import app from "../../app.js";
import { env } from "../../config/env.js";
import { connectDatabase, disconnectDatabase } from "../../database/mongodb.js";
import { logger } from "../../lib/logger.js";
import { SessionModel } from "./session.model.js";
import { UserModel } from "./user.model.js";
import { getRefreshCookieOptions, REFRESH_TOKEN_COOKIE } from "./auth.controller.js";

const API = "/api/v1/auth";

function extractRawSetCookie(response: request.Response): string {
  const setCookie = response.headers["set-cookie"];
  if (Array.isArray(setCookie)) {
    return setCookie[0] ?? "";
  }
  return typeof setCookie === "string" ? setCookie : "";
}

function extractCookieValue(response: request.Response): string {
  const raw = extractRawSetCookie(response);
  return raw.split(";")[0] ?? "";
}

describe("Authentication, CORS, and Session Security", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      SessionModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("CORS Security", () => {
    it("allows configured WEB_ORIGIN with credentials on preflight OPTIONS", async () => {
      const response = await request(app)
        .options(`${API}/login`)
        .set("Origin", env.WEB_ORIGIN)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type,Authorization");

      expect(response.headers["access-control-allow-origin"]).toBe(env.WEB_ORIGIN);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("allows configured WEB_ORIGIN on actual POST request with credentials", async () => {
      const response = await request(app)
        .post(`${API}/register`)
        .set("Origin", env.WEB_ORIGIN)
        .send({
          firstName: "Security",
          lastName: "Tester",
          email: "cors-test@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(env.WEB_ORIGIN);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("does not allow unauthorized origins", async () => {
      const response = await request(app)
        .post(`${API}/login`)
        .set("Origin", "https://malicious-site.com")
        .send({ email: "user@example.com", password: "password123" });

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("Cookie Security & Cross-Site Transmission", () => {
    it("sets HttpOnly, Path=/api/v1/auth, and correct cookie parameters", async () => {
      const response = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Cookie",
          lastName: "Tester",
          email: "cookie-test@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(200);
      const rawCookie = extractRawSetCookie(response);

      expect(rawCookie).toContain(`${REFRESH_TOKEN_COOKIE}=`);
      expect(rawCookie.toLowerCase()).toContain("httponly");
      expect(rawCookie).toContain("Path=/api/v1/auth");
      expect(rawCookie).toContain("Max-Age=");
    });

    it("evaluates getRefreshCookieOptions correctly in production and non-production", () => {
      const devOptions = getRefreshCookieOptions();
      expect(devOptions.httpOnly).toBe(true);
      expect(devOptions.path).toBe("/api/v1/auth");

      // In production mode, sameSite must be none and secure must be true for cross-site Vercel domains
      const originalNodeEnv = env.NODE_ENV;
      try {
        (env as { NODE_ENV: string }).NODE_ENV = "production";
        const prodOptions = getRefreshCookieOptions();
        expect(prodOptions.secure).toBe(true);
        expect(prodOptions.sameSite).toBe("none");
        expect(prodOptions.httpOnly).toBe(true);
      } finally {
        (env as { NODE_ENV: string }).NODE_ENV = originalNodeEnv;
      }
    });

    it("never returns the refresh token inside the JSON response payload", async () => {
      const response = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Json",
          lastName: "Leak",
          email: "json-leak@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain("refreshToken");
    });
  });

  describe("Session Lifecycle & Token Rotation", () => {
    it("rotates refresh token and invalidates old token upon /refresh", async () => {
      const regRes = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Rotate",
          lastName: "Tester",
          email: "rotate-test@example.com",
          password: "SecurePassword123!",
        });

      const initialCookie = extractCookieValue(regRes);
      expect(initialCookie).toBeTruthy();

      // First refresh succeeds with new access token and rotated cookie
      const refreshRes = await request(app)
        .post(`${API}/refresh`)
        .set("Cookie", [initialCookie]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      const rotatedCookie = extractCookieValue(refreshRes);
      expect(rotatedCookie).toBeTruthy();
      expect(rotatedCookie).not.toBe(initialCookie);

      // Replaying the old initialCookie must be rejected (reuse detection)
      const replayRes = await request(app)
        .post(`${API}/refresh`)
        .set("Cookie", [initialCookie]);

      expect(replayRes.status).toBe(401);
    });

    it("revokes session on logout and clears the refresh cookie", async () => {
      const regRes = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Logout",
          lastName: "Tester",
          email: "logout-test@example.com",
          password: "SecurePassword123!",
        });

      const cookie = extractCookieValue(regRes);

      const logoutRes = await request(app)
        .post(`${API}/logout`)
        .set("Cookie", [cookie]);

      expect(logoutRes.status).toBe(200);
      const clearCookieHeader = extractRawSetCookie(logoutRes);
      expect(clearCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=;`);

      // Attempting to refresh after logout fails
      const refreshRes = await request(app)
        .post(`${API}/refresh`)
        .set("Cookie", [cookie]);

      expect(refreshRes.status).toBe(401);
    });

    it("rejects refresh when session has expired due to inactivity", async () => {
      const regRes = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Inactive",
          lastName: "Tester",
          email: "inactive-test@example.com",
          password: "SecurePassword123!",
        });

      const cookie = extractCookieValue(regRes);
      const userId = regRes.body.data.user.id;

      // Simulate 25 hours of inactivity
      const pastTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await SessionModel.updateMany({ userId }, { lastActivityAt: pastTime });

      const refreshRes = await request(app)
        .post(`${API}/refresh`)
        .set("Cookie", [cookie]);

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.errors[0]?.code).toBe("SESSION_EXPIRED");
    });
  });

  describe("Secret Privacy in Logging", () => {
    it("never outputs JWT secrets or raw tokens in structured logger calls", async () => {
      const loggerInfoSpy = vi.spyOn(logger, "info");
      const loggerWarnSpy = vi.spyOn(logger, "warn");
      const loggerErrorSpy = vi.spyOn(logger, "error");

      const response = await request(app)
        .post(`${API}/register`)
        .send({
          firstName: "Log",
          lastName: "Privacy",
          email: "log-privacy@example.com",
          password: "SecurePassword123!",
        });

      const rawCookie = extractCookieValue(response);
      const rawToken = rawCookie.split("=")[1];

      for (const call of [
        ...loggerInfoSpy.mock.calls,
        ...loggerWarnSpy.mock.calls,
        ...loggerErrorSpy.mock.calls,
      ]) {
        const serialized = JSON.stringify(call);
        expect(serialized).not.toContain(env.JWT_ACCESS_SECRET);
        expect(serialized).not.toContain(env.JWT_REFRESH_SECRET);
        if (rawToken) {
          expect(serialized).not.toContain(rawToken);
        }
      }
    });
  });
});
