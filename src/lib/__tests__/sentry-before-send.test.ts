import { describe, it, expect } from "vitest";
import { sentryBeforeSend } from "../sentry-before-send";
import type { ErrorEvent } from "@sentry/react";

describe("sentryBeforeSend", () => {
  // Test 1: strips user.email
  it("strips user.email from event", () => {
    const event: ErrorEvent = {
      user: { id: "user-123", email: "student@uni.edu", username: "student" },
    };
    const result = sentryBeforeSend(event);
    expect(result).not.toBeNull();
    expect(result!.user).not.toHaveProperty("email");
    expect(result!.user?.id).toBe("user-123");
    expect(result!.user?.username).toBe("student");
  });

  // Test 2: no crash when event has no user object
  it("returns event unchanged when no user object", () => {
    const event: ErrorEvent = { message: "Something broke" };
    const result = sentryBeforeSend(event);
    expect(result).not.toBeNull();
    expect(result!.message).toBe("Something broke");
    expect(result!.user).toBeUndefined();
  });

  // Test 3: redacts icalUrl param in event.request.url
  it("redacts icalUrl param value in event.request.url", () => {
    const event: ErrorEvent = {
      request: { url: "https://app.com/api?icalUrl=SECRET123&foo=bar" },
    };
    const result = sentryBeforeSend(event);
    expect(result!.request!.url).toBe(
      "https://app.com/api?icalUrl=REDACTED&foo=bar"
    );
  });

  // Test 4: redacts token param in event.request.url
  it("redacts token param value in event.request.url", () => {
    const event: ErrorEvent = {
      request: {
        url: "https://moodle.example.com/calendar/export_execute.php?token=abc123",
      },
    };
    const result = sentryBeforeSend(event);
    expect(result!.request!.url).toBe(
      "https://moodle.example.com/calendar/export_execute.php?token=REDACTED"
    );
  });

  // Test 5: leaves URL unchanged when no sensitive params
  it("leaves event.request.url unchanged when no sensitive params", () => {
    const event: ErrorEvent = {
      request: { url: "https://app.com/dashboard" },
    };
    const result = sentryBeforeSend(event);
    expect(result!.request!.url).toBe("https://app.com/dashboard");
  });

  // Test 6: no crash when event has no request object
  it("returns event unchanged when no request object", () => {
    const event: ErrorEvent = { message: "No request" };
    const result = sentryBeforeSend(event);
    expect(result).not.toBeNull();
    expect(result!.request).toBeUndefined();
  });

  // Test 7: redacts icalUrl param in breadcrumb data.url
  // Note: Sentry v10 Event.breadcrumbs is Breadcrumb[] (flat array), not { values: [] }
  it("redacts icalUrl param value in breadcrumb data.url", () => {
    const event: ErrorEvent = {
      breadcrumbs: [
        {
          type: "http",
          data: { url: "https://xyz.supabase.co/functions/v1/uvec-proxy?icalUrl=SECRET&method=GET" },
        },
      ],
    };
    const result = sentryBeforeSend(event);
    expect(result!.breadcrumbs![0].data!.url).toBe(
      "https://xyz.supabase.co/functions/v1/uvec-proxy?icalUrl=REDACTED&method=GET"
    );
  });

  // Test 8: leaves breadcrumb unchanged when data has no url key
  it("leaves breadcrumb unchanged when data has no url key", () => {
    const event: ErrorEvent = {
      breadcrumbs: [
        {
          type: "navigation",
          data: { from: "/login", to: "/dashboard" },
        },
      ],
    };
    const result = sentryBeforeSend(event);
    expect(result!.breadcrumbs![0].data).toEqual({
      from: "/login",
      to: "/dashboard",
    });
  });

  // Test 9: no crash when event has no breadcrumbs
  it("returns event unchanged when no breadcrumbs", () => {
    const event: ErrorEvent = { message: "No breadcrumbs" };
    const result = sentryBeforeSend(event);
    expect(result).not.toBeNull();
    expect(result!.breadcrumbs).toBeUndefined();
  });

  // Test 10: combined — scrubs email + request URL token + breadcrumb icalUrl
  it("scrubs all PII in a combined event", () => {
    const event: ErrorEvent = {
      user: { id: "u1", email: "pii@example.com" },
      request: {
        url: "https://moodle.example.com/calendar/export_execute.php?token=supersecret&other=keep",
      },
      breadcrumbs: [
        {
          type: "http",
          data: { url: "https://proxy.supabase.co?icalUrl=TOPSECRET&page=1" },
        },
      ],
    };
    const result = sentryBeforeSend(event);
    expect(result).not.toBeNull();
    // email stripped
    expect(result!.user).not.toHaveProperty("email");
    expect(result!.user?.id).toBe("u1");
    // request URL token redacted
    expect(result!.request!.url).toBe(
      "https://moodle.example.com/calendar/export_execute.php?token=REDACTED&other=keep"
    );
    // breadcrumb icalUrl redacted
    expect(result!.breadcrumbs![0].data!.url).toBe(
      "https://proxy.supabase.co?icalUrl=REDACTED&page=1"
    );
  });
});
