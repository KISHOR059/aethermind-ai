# Authentication & Session Management

This document describes the AetherMind authentication architecture and session
lifecycle after the introduction of server-side session management.

## Overview

AetherMind uses a **stateless access token + stateful refresh session** model:

- **Access token** (`JWT`): short-lived (default 15m), stateless, carries
  `{ sub, role }`. It is stored in `localStorage` on the client and sent as
  `Authorization: Bearer <token>`. It grants access to API resources. The API
  does **not** consult the database for every authenticated request.
- **Refresh token** (`JWT`): longer-lived (default 7d), carries
  `{ sub, sid, role, jti }` where `sid` is the server-side session identifier.
  It is stored in an **HttpOnly, SameSite=Lax, Secure (in production)** cookie
  and is never exposed to JavaScript.
- **Session record** (MongoDB `sessions` collection): the authoritative
  server-side state. JWT expiration alone is **never** treated as the complete
  session-management mechanism; every refresh validates the corresponding
  session record.

## JWT lifecycle

| Token | Claims | Lifetime (env) | Storage |
| --- | --- | --- | --- |
| Access token | `{ sub, role }` | `JWT_ACCESS_EXPIRES_IN` (15m) | `localStorage` |
| Refresh token | `{ sub, sid, role, jti }` | `JWT_REFRESH_EXPIRES_IN` (7d) | HttpOnly cookie |

The `jti` claim guarantees that every issued refresh token is unique, which
makes rotation and reuse detection reliable (two tokens issued in the same
second would otherwise be byte-identical).

## Session lifecycle

A session is created on successful login/registration and lives until one of:

1. The user signs out (session revoked).
2. The user revokes the session (Settings → Active Sessions).
3. The user signs out all sessions.
4. **Inactivity timeout** (default 24h): `now - lastActivityAt >
   SESSION_INACTIVITY_TIMEOUT_MS`.
5. **Absolute lifetime** (default 7d): `now > absoluteExpiresAt`.

### Session record (`sessions` collection)

| Field | Description |
| --- | --- |
| `_id` | Session identifier, embedded in the refresh token as `sid` |
| `userId` | Owning user (ObjectId) |
| `refreshTokenHash` | SHA-256 hash of the current refresh token — **never** stored raw |
| `createdAt` | Session creation time |
| `lastActivityAt` | Last activity; refreshed on every token refresh / continue-session |
| `expiresAt` | Inactivity deadline (`lastActivityAt + SESSION_INACTIVITY_TIMEOUT_MS`) |
| `absoluteExpiresAt` | Absolute deadline (`createdAt + SESSION_MAX_LIFETIME_MS`); TTL index auto-cleans records |
| `revokedAt` | Set when the session is signed out or revoked |
| `userAgent` | Browser/device user-agent captured at login |
| `ipAddress` | IP address captured at login |

Indexes: `userId`, `refreshTokenHash` (unique), compound
`{ userId, lastActivityAt }`, `{ userId, revokedAt }`, and a TTL index on
`absoluteExpiresAt` for automatic cleanup.

## Refresh-token rotation

Every successful refresh:

1. Verifies the JWT signature and expiry.
2. Extracts `sid` and loads the session record.
3. Verifies the session belongs to `sub` (session ownership).
4. Rejects if `revokedAt` is set.
5. Rejects if the inactivity timeout or absolute lifetime has elapsed
   (the expired session record is revoked in the process).
6. Hashes the presented token and compares it with `refreshTokenHash`.
   A mismatch revokes the session (reuse detection).
7. Issues a **new** refresh token (with a fresh `jti`) for the **same** `sid`,
   atomically updating the stored hash with a conditional
   `findOneAndUpdate({ _id, refreshTokenHash: previousHash })`. If another
   request already rotated the token, the request is rejected with `401`
   instead of creating a second session.
8. Updates `lastActivityAt` / `expiresAt` and issues a new access token.

A refresh **never** creates a new session.

## API endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | — | Creates a user + session |
| `POST` | `/api/v1/auth/login` | — | Creates a session, sets refresh cookie |
| `POST` | `/api/v1/auth/refresh` | cookie | Rotates the refresh token, returns a new access token |
| `POST` | `/api/v1/auth/logout` | cookie | Revokes the current session, clears the cookie |
| `POST` | `/api/v1/auth/logout-all` | Bearer | Revokes **all** sessions of the user |
| `GET` | `/api/v1/auth/me` | Bearer | Returns the current user |
| `GET` | `/api/v1/auth/sessions` | Bearer | Lists active sessions (`isCurrent`, no hashes) |
| `DELETE` | `/api/v1/auth/sessions/:sessionId` | Bearer | Revokes a session owned by the user |

The refresh cookie has `path=/api/v1/auth` so it is only sent to auth
endpoints. Session endpoints return `401` with `SESSION_EXPIRED`/`UNAUTHORIZED`
error codes for invalid, expired, or revoked sessions.

## Frontend behavior

- **Axios interceptor** (`shared/lib/api-client.ts`):
  - Attaches the access token to every request.
  - On `401`, performs a single shared refresh (a module-level promise
    deduplicates concurrent refreshes — one refresh request per burst).
  - Retries the original request with the new access token exactly once
    (`_skipAuthRefresh`); auth endpoints never trigger the refresh path.
  - If the refresh itself returns `401`, the session is considered expired:
    it clears the access token, invokes the registered session-expired
    handler (which clears auth state and React Query cache), broadcasts the
    event to other tabs, and redirects to `/login`.
- **Activity tracking** (`features/auth/session/session-activity.ts`):
  - Listens to `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`,
    `click`, and `visibilitychange`.
  - Writes a lightweight timestamp to `localStorage` at most every 30s.
    `localStorage` is shared across tabs, so an active tab keeps background
    tabs alive; background timers are throttled by the browser, which is fine
    because the server remains the authority.
- **Warning & automatic sign-out** (`SessionManager.tsx`): a 15s interval
  compares idle time against `VITE_SESSION_INACTIVITY_TIMEOUT_MS`. Within
  `VITE_SESSION_WARNING_MS` of the deadline a dialog offers **Continue
  Session** (performs a refresh, updating server activity) or **Sign Out**.
  Past the deadline the app signs out with the "session expired due to
  inactivity" message.
- **Multi-tab sync** (`shared/lib/auth-sync.ts`): logout / session-expiry
  events are broadcast via `BroadcastChannel` with a `storage`-event
  fallback. Events are debounced by deduplication and sender IDs, and
  receiving tabs do not re-broadcast.

## Settings UI

The Settings page includes an **Active Sessions** card:

- Current session ("This device"), device/browser, IP, last activity, expiry.
- Sign out any individual session.
- **Sign Out All Other Sessions** revokes every non-current session.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime (duration string) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime (duration string) |
| `SESSION_INACTIVITY_TIMEOUT_MS` | `86400000` | Inactivity timeout (24h) |
| `SESSION_MAX_LIFETIME_MS` | `604800000` | Absolute session lifetime (7d) |
| `SESSION_WARNING_MS` | `300000` | Warning period before inactivity expiry (5m) |
| `VITE_SESSION_INACTIVITY_TIMEOUT_MS` | `86400000` | Frontend mirror of the inactivity timeout |
| `VITE_SESSION_WARNING_MS` | `300000` | Frontend mirror of the warning period |

`SESSION_WARNING_MS` must be smaller than `SESSION_INACTIVITY_TIMEOUT_MS`;
misconfiguration aborts startup.

### Production recommendations

- Set real, long, random `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
  (≥ 32 chars) — required in production.
- Set `SESSION_INACTIVITY_TIMEOUT_MS` and `SESSION_MAX_LIFETIME_MS` according
  to your compliance policy. Keep the access token short (15m) and rotate the
  refresh token on every refresh.
- Deploy behind TLS: the refresh cookie is marked `Secure` when
  `NODE_ENV=production`.
- Terminate `X-Forwarded-For` correctly at the reverse proxy so stored IP
  addresses reflect the real client; the controller reads
  `X-Forwarded-For` first.
- Consider moving the access token out of `localStorage` into an in-memory
  variable if XSS is a top threat model concern (see below).

## Security considerations

- **Session ownership**: refresh and revocation paths verify that the session
  belongs to the authenticated user; revoking another user's session returns
  `404` without leaking existence.
- **Refresh-token rotation**: every refresh issues a new token; old tokens are
  rejected.
- **Reuse detection**: presenting a rotated-away token revokes the session.
- **Refresh-token hashing**: only SHA-256 hashes are stored in MongoDB.
- **No raw credentials in logs**: the request logger records method, path,
  status, duration, user-agent and IP only. The error middleware logs error
  messages and stack traces, never tokens, secrets, passwords, or hashes.
- **CSRF**: the refresh cookie uses `SameSite=Lax` (and `Secure` in
  production), which blocks cross-site POSTs while keeping the app usable.
  If the cookie policy is ever relaxed, add CSRF tokens to refresh/logout.
- **XSS**: the refresh token is HttpOnly, so it is not readable by injected
  scripts. The access token remains in `localStorage` (pre-existing design);
  migrating it to an in-memory holder (with an HttpOnly cookie or
  `keepalive`/`sendBeacon` strategies) is a recommended follow-up but would be
  a larger architectural change.
- **Logout**: revokes the server-side session and clears the cookie, so the
  refresh token cannot be replayed.
- **Logout-all**: revokes every session of the user, including the current
  device.

## Testing

`apps/api` contains an integration suite (`auth.session.test.ts`, run with
`pnpm test`) covering: session creation, invalid-credential handling, expired
access tokens, refresh success, rotation, old-token reuse rejection, inactivity
expiry, absolute expiry, logout, logout-all, session listing (without hashes),
session revocation, cross-user revocation protection, and idempotent logout.

Frontend behaviors (refresh deduplication, no infinite refresh loops, warning
dialog, multi-tab logout sync, redirect on expired session) are exercised
during manual authentication testing.
