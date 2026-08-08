import jwt from "jsonwebtoken";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import app from "../../app.js";
import { env } from "../../config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../database/mongodb.js";
import { SessionModel } from "./session.model.js";
import { UserModel } from "./user.model.js";

const API = "/api/v1/auth";

type AuthFixture = {
  userId: string;
  accessToken: string;
  cookie: string;
};

function extractCookie(response: request.Response): string {
  const setCookie = response.headers["set-cookie"];

  if (Array.isArray(setCookie)) {
    return setCookie[0]?.split(";")[0] ?? "";
  }

  return typeof setCookie === "string" ? setCookie.split(";")[0] : "";
}

async function createUser(
  email = "user@example.com",
): Promise<request.Response> {
  return request(app).post(`${API}/register`).send({
    firstName: "Test",
    lastName: "User",
    email,
    password: "password123",
  }).set("User-Agent", "vitest/test-browser");
}

async function signIn(
  email = "user@example.com",
  password = "password123",
): Promise<request.Response> {
  return request(app)
    .post(`${API}/login`)
    .send({ email, password })
    .set("User-Agent", "vitest/test-browser");
}

async function authFixture(email = "user@example.com"): Promise<AuthFixture> {
  const response = await createUser(email);

  return {
    userId: response.body.data.user.id,
    accessToken: response.body.data.accessToken,
    cookie: extractCookie(response),
  };
}

function sessionCount(userId: string) {
  return SessionModel.countDocuments({ userId });
}

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

describe("auth sessions", () => {
  it("creates a session on successful login", async () => {
    const response = await createUser();
    const userId = response.body.data.user.id;
    const cookie = extractCookie(response);

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeTypeOf("string");
    expect(response.body.data.user.id).toBe(userId);
    expect(cookie).toContain("aethermind_refresh_token=");
    expect(await sessionCount(userId)).toBe(1);

    const session = await SessionModel.findOne({ userId });
    expect(session?.refreshTokenHash).toBeTruthy();
    expect(session?.refreshTokenHash).not.toContain(cookie.split("=")[1]);
  });

  it("does not create a session for invalid credentials", async () => {
    await createUser();

    const response = await request(app)
      .post(`${API}/login`)
      .send({ email: "user@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(await SessionModel.countDocuments({})).toBe(1);
  });

  it("rejects an expired access token", async () => {
    const { userId } = await authFixture();
    const expiredToken = jwt.sign(
      { sub: userId, role: "USER" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: -1 },
    );

    const response = await request(app)
      .get(`${API}/me`)
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it("refreshes without creating a new session", async () => {
    const { userId, cookie } = await authFixture();
    const before = await SessionModel.findOne({ userId });

    const response = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeTypeOf("string");
    expect(await sessionCount(userId)).toBe(1);

    const after = await SessionModel.findOne({ userId });
    expect(after?.refreshTokenHash).not.toBe(before?.refreshTokenHash);

    const me = await request(app)
      .get(`${API}/me`)
      .set("Authorization", `Bearer ${response.body.data.accessToken}`);

    expect(me.status).toBe(200);
  });

  it("rotates the refresh token and rejects the old one", async () => {
    const { cookie } = await authFixture();

    const first = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);
    expect(first.status).toBe(200);

    const rotatedCookie = extractCookie(first);

    const reuse = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.message).toBe("Invalid refresh token");

    const rotatedTokenRejectedAfterReuse = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", rotatedCookie);
    expect(rotatedTokenRejectedAfterReuse.status).toBe(401);
  });

  it("rejects a refresh after the inactivity timeout", async () => {
    const { userId, cookie } = await authFixture();
    const session = await SessionModel.findOne({ userId });

    expect(session).not.toBeNull();
    session!.lastActivityAt = new Date(
      Date.now() - env.SESSION_INACTIVITY_TIMEOUT_MS - 60_000,
    );
    await session!.save();

    const response = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inactivity/i);

    const revoked = await SessionModel.findById(session!._id);
    expect(revoked?.revokedAt).toBeInstanceOf(Date);
  });

  it("rejects a refresh after the absolute session lifetime", async () => {
    const { userId, cookie } = await authFixture();
    const session = await SessionModel.findOne({ userId });

    expect(session).not.toBeNull();
    session!.absoluteExpiresAt = new Date(Date.now() - 1_000);
    await session!.save();

    const response = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/expired/i);
  });

  it("revokes the session on logout", async () => {
    const { userId, cookie } = await authFixture();

    const logout = await request(app)
      .post(`${API}/logout`)
      .set("Cookie", cookie);
    expect(logout.status).toBe(200);

    const refresh = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", cookie);
    expect(refresh.status).toBe(401);

    const session = await SessionModel.findOne({ userId });
    expect(session?.revokedAt).toBeInstanceOf(Date);
  });

  it("logs out idempotently without a refresh cookie", async () => {
    const response = await request(app).post(`${API}/logout`);

    expect(response.status).toBe(200);
  });

  it("revokes every session on logout-all", async () => {
    const first = await authFixture("user@example.com");
    const second = await signIn();
    const secondCookie = extractCookie(second);

    expect(await sessionCount(first.userId)).toBe(2);

    const response = await request(app)
      .post(`${API}/logout-all`)
      .set("Authorization", `Bearer ${first.accessToken}`)
      .set("Cookie", secondCookie);

    expect(response.status).toBe(200);

    const sessions = await SessionModel.find({ userId: first.userId });
    expect(sessions).toHaveLength(2);
    expect(sessions.every((session) => session.revokedAt instanceof Date)).toBe(true);

    const oldFirst = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", first.cookie);
    const oldSecond = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", secondCookie);

    expect(oldFirst.status).toBe(401);
    expect(oldSecond.status).toBe(401);
  });

  it("lists active sessions without exposing hashes", async () => {
    const { userId, accessToken, cookie } = await authFixture();

    const response = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    const [session] = response.body.data.sessions;

    expect(response.body.data.sessions).toHaveLength(1);
    expect(session.id).toBeTypeOf("string");
    expect(session.isCurrent).toBe(true);
    expect(session.createdAt).toBeTruthy();
    expect(session.lastActivityAt).toBeTruthy();
    expect(session.expiresAt).toBeTruthy();
    expect(session.userAgent).toBeTypeOf("string");
    expect(session.ipAddress).toBeTypeOf("string");
    expect(session).not.toHaveProperty("refreshTokenHash");
    expect(session).not.toHaveProperty("userId");
    expect(session).not.toHaveProperty("revokedAt");
    expect(session).not.toHaveProperty("ipAddressHashed");

    const dbSession = await SessionModel.findOne({ userId });
    expect(dbSession?.refreshTokenHash).not.toBe(session.id);
  });

  it("requires authentication for the session list", async () => {
    const response = await request(app).get(`${API}/sessions`);

    expect(response.status).toBe(401);
  });

  it("revokes another session owned by the same user", async () => {
    const first = await authFixture("user@example.com");
    const secondLogin = await signIn();
    const secondCookie = extractCookie(secondLogin);

    expect(await sessionCount(first.userId)).toBe(2);

    const sessions = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${first.accessToken}`);
    const otherSession = sessions.body.data.sessions.find(
      (session: { isCurrent: boolean }) => !session.isCurrent,
    );

    const response = await request(app)
      .delete(`${API}/sessions/${otherSession.id}`)
      .set("Authorization", `Bearer ${first.accessToken}`);
    expect(response.status).toBe(200);

    const revoked = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", secondCookie);
    expect(revoked.status).toBe(401);

    const current = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", first.cookie);
    expect(current.status).toBe(200);
  });

  it("prevents a user from revoking another user's sessions", async () => {
    const owner = await authFixture("owner@example.com");
    const intruder = await authFixture("intruder@example.com");

    const ownerSessions = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    const ownerSessionId = ownerSessions.body.data.sessions[0].id;

    const response = await request(app)
      .delete(`${API}/sessions/${ownerSessionId}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`);

    expect(response.status).toBe(404);

    const intruderSessions = await request(app)
      .get(`${API}/sessions`)
      .set("Authorization", `Bearer ${intruder.accessToken}`);
    expect(intruderSessions.body.data.sessions).toHaveLength(1);
    expect(intruderSessions.body.data.sessions[0].id).not.toBe(ownerSessionId);

    const stillActive = await request(app)
      .post(`${API}/refresh`)
      .set("Cookie", owner.cookie);
    expect(stillActive.status).toBe(200);
  });
});
