import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ErrorInfo } from "react";

// Mock @sentry/react before importing anything that uses it
const mockCaptureReactException = vi.fn();
vi.mock("@sentry/react", () => ({
  captureReactException: mockCaptureReactException,
}));

// Import after mock is set up
// We test the componentDidCatch logic by instantiating the class directly
const { ErrorBoundary } = await import("../error-boundary");

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Sentry.captureReactException with the error and errorInfo in componentDidCatch", () => {
    const boundary = new ErrorBoundary({ children: null });
    const error = new Error("test error");
    const errorInfo: ErrorInfo = { componentStack: "\n    at TestComponent" };

    boundary.componentDidCatch(error, errorInfo);

    expect(mockCaptureReactException).toHaveBeenCalledOnce();
    expect(mockCaptureReactException).toHaveBeenCalledWith(error, errorInfo);
  });

  it("calls console.error in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const boundary = new ErrorBoundary({ children: null });
    const error = new Error("dev error");
    const errorInfo: ErrorInfo = { componentStack: "\n    at TestComponent" };

    boundary.componentDidCatch(error, errorInfo);

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "ErrorBoundary caught:",
      error,
      errorInfo,
    );

    consoleErrorSpy.mockRestore();
    vi.stubEnv("NODE_ENV", originalEnv);
  });

  it("does NOT call console.error in production mode", () => {
    vi.stubEnv("NODE_ENV", "production");

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const boundary = new ErrorBoundary({ children: null });
    const error = new Error("prod error");
    const errorInfo: ErrorInfo = { componentStack: "\n    at TestComponent" };

    boundary.componentDidCatch(error, errorInfo);

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    vi.stubEnv("NODE_ENV", "test");
  });
});
