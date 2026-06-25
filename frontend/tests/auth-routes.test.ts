import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, beforeEach } from "node:test";
import { NextResponse } from "next/server";
import { auditAuthEvent } from "../lib/audit";
import { getClientIp, rateLimitedResponse } from "../lib/auth-request";
import {
  AUTH_RATE_LIMIT_RULES,
  buildRateLimitKey,
  checkRateLimit,
  normalizeRateLimitPart,
  resetInMemoryRateLimitsForTests
} from "../lib/rate-limit";
import { POST as registerPost } from "../app/api/auth/register/route";
import { POST as forgotPasswordPost } from "../app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "../app/api/auth/reset-password/route";
import { POST as verifyEmailPost } from "../app/api/auth/verify-email/route";
import { POST as resendVerificationPost } from "../app/api/auth/resend-verification/route";

const root = resolve(process.cwd());

function jsonRequest(url: string, body: unknown, ip = "203.0.113.10") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip
    },
    body: JSON.stringify(body)
  });
}

async function saturate(route: keyof typeof AUTH_RATE_LIMIT_RULES, identifier: string, ip = "203.0.113.10") {
  for (let index = 0; index < AUTH_RATE_LIMIT_RULES[route].limit; index += 1) {
    const result = await checkRateLimit(route, ip, identifier);
    assert.equal(result.allowed, true);
  }
}

describe("auth rate limiting", () => {
  beforeEach(() => {
    resetInMemoryRateLimitsForTests();
  });

  it("normalizes identifiers and builds stable keys", () => {
    assert.equal(normalizeRateLimitPart(" Doctor+Test@Example.COM "), "doctor_test@example.com");
    assert.equal(buildRateLimitKey("login", "10.0.0.1", "USER@EMAIL.COM"), "auth:login:10.0.0.1:user@email.com");
  });

  it("limits login attempts with retry metadata", async () => {
    for (let index = 0; index < AUTH_RATE_LIMIT_RULES.login.limit; index += 1) {
      const result = await checkRateLimit("login", "10.0.0.2", "doctor@example.com");
      assert.equal(result.allowed, true);
    }

    const blocked = await checkRateLimit("login", "10.0.0.2", "doctor@example.com");
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfter > 0);
  });

  it("fails closed in production when distributed rate limit storage is missing", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalFallback = process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK;
    process.env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK;

    try {
      const result = await checkRateLimit("login", "10.0.0.3", "doctor@example.com");
      assert.equal(result.allowed, false);
      assert.equal(result.remaining, 0);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      if (originalFallback) process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK = originalFallback;
    }
  });

  it("supports Firestore as a distributed production rate limit store", () => {
    const source = readFileSync(resolve(root, "lib/rate-limit.ts"), "utf8");
    assert.match(source, /RATE_LIMIT_PROVIDER/);
    assert.match(source, /firestore/);
    assert.match(source, /getGoogleCloudAccessToken/);
  });

  it("returns a 429 response with Retry-After", async () => {
    const response = rateLimitedResponse(123);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "123");
    assert.deepEqual(await response.json(), { error: "Muitas tentativas. Aguarde antes de tentar novamente." });
  });

  it("extracts the first forwarded client IP", () => {
    const request = new Request("https://iatron.app/api", {
      headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" }
    });
    assert.equal(getClientIp(request), "198.51.100.1");
  });
});

describe("auth route 429 contracts", () => {
  beforeEach(() => {
    resetInMemoryRateLimitsForTests();
  });

  it("protects register route", async () => {
    await saturate("register", "new@example.com");
    const response = await registerPost(jsonRequest("https://iatron.app/api/auth/register", {
      name: "Doctor",
      email: "new@example.com",
      password: "strong-password"
    }));
    assert.equal(response.status, 429);
    assert.ok(response.headers.get("Retry-After"));
  });

  it("protects forgot-password route without user enumeration", async () => {
    await saturate("forgotPassword", "doctor@example.com");
    const response = await forgotPasswordPost(jsonRequest("https://iatron.app/api/auth/forgot-password", {
      email: "doctor@example.com"
    }));
    assert.equal(response.status, 429);
  });

  it("protects reset-password route", async () => {
    const token = "reset-token-value-that-is-long-enough";
    await saturate("resetPassword", token.slice(0, 12));
    const response = await resetPasswordPost(jsonRequest("https://iatron.app/api/auth/reset-password", {
      token,
      password: "new-strong-password"
    }));
    assert.equal(response.status, 429);
  });

  it("protects verify-email route", async () => {
    const token = "verify-token-value-that-is-long-enough";
    await saturate("verifyEmail", token.slice(0, 12));
    const response = await verifyEmailPost(jsonRequest("https://iatron.app/api/auth/verify-email", {
      token
    }));
    assert.equal(response.status, 429);
  });

  it("protects resend-verification route with generic response path", async () => {
    await saturate("resendVerification", "doctor@example.com");
    const response = await resendVerificationPost(jsonRequest("https://iatron.app/api/auth/resend-verification", {
      email: "doctor@example.com"
    }));
    assert.equal(response.status, 429);
  });
});

describe("auth audit logger", () => {
  it("emits structured audit events without sensitive metadata", () => {
    const original = console.info;
    let captured = "";
    console.info = (message?: unknown) => {
      captured = String(message);
    };

    try {
      auditAuthEvent("register_requested", {
        email: "doctor@example.com",
        password: "must-not-be-logged",
        token: "must-not-be-logged"
      });
    } finally {
      console.info = original;
    }

    const payload = JSON.parse(captured);
    assert.equal(payload.scope, "auth");
    assert.equal(payload.event, "register_requested");
    assert.equal(payload.email, "doctor@example.com");
    assert.equal(payload.password, undefined);
    assert.equal(payload.token, undefined);
  });
});
