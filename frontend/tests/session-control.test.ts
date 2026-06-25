import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UserSessionStatus } from "@prisma/client";
import { getSessionInvalidReason, shouldTouchSession } from "../lib/session-control";

const now = new Date("2026-06-23T12:00:00.000Z");

describe("session control domain rules", () => {
  it("allows the current active non-expired session", () => {
    const reason = getSessionInvalidReason({
      status: UserSessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: new Date("2026-06-24T12:00:00.000Z"),
      idleExpiresAt: new Date("2026-06-23T13:00:00.000Z"),
      newestActiveSessionId: "session_current",
      sessionId: "session_current",
      now
    });

    assert.equal(reason, null);
  });

  it("rejects revoked sessions even when the JWT is otherwise valid", () => {
    const reason = getSessionInvalidReason({
      status: UserSessionStatus.REVOKED,
      revokedAt: new Date("2026-06-23T11:00:00.000Z"),
      expiresAt: new Date("2026-06-24T12:00:00.000Z"),
      idleExpiresAt: new Date("2026-06-23T13:00:00.000Z"),
      sessionId: "session_old",
      now
    });

    assert.equal(reason, "SESSION_REVOKED");
  });

  it("rejects sessions replaced by a newer active login", () => {
    const reason = getSessionInvalidReason({
      status: UserSessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: new Date("2026-06-24T12:00:00.000Z"),
      idleExpiresAt: new Date("2026-06-23T13:00:00.000Z"),
      newestActiveSessionId: "session_new",
      sessionId: "session_old",
      now
    });

    assert.equal(reason, "SESSION_NOT_CURRENT");
  });

  it("rejects idle or absolute timeout", () => {
    assert.equal(
      getSessionInvalidReason({
        status: UserSessionStatus.ACTIVE,
        expiresAt: new Date("2026-06-23T11:59:59.000Z"),
        idleExpiresAt: new Date("2026-06-23T13:00:00.000Z"),
        sessionId: "session",
        now
      }),
      "SESSION_EXPIRED"
    );
    assert.equal(
      getSessionInvalidReason({
        status: UserSessionStatus.ACTIVE,
        expiresAt: new Date("2026-06-24T12:00:00.000Z"),
        idleExpiresAt: new Date("2026-06-23T11:59:59.000Z"),
        sessionId: "session",
        now
      }),
      "SESSION_EXPIRED"
    );
  });

  it("touches sessions only after the configured interval", () => {
    assert.equal(shouldTouchSession(new Date("2026-06-23T11:59:30.000Z"), now), false);
    assert.equal(shouldTouchSession(new Date("2026-06-23T11:58:00.000Z"), now), true);
  });
});
