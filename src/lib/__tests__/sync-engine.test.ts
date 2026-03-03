// Integration tests for sync engine

import { syncTasks } from "../sync-engine";

const BASE_CONFIG = { supabaseAccessToken: "test-token" };

describe("syncTasks", () => {
  it("should return empty tasks with helpful error when no sources configured", async () => {
    const result = await syncTasks(BASE_CONFIG);
    expect(result.tasks).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("No data sources configured");
  });

  it("should return SyncResult shape", async () => {
    const result = await syncTasks(BASE_CONFIG);
    expect(result).toHaveProperty("tasks");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.tasks)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
