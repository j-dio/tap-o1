import { describe, expect, it } from "vitest";
import { shouldActivatePullToRefresh } from "../use-pull-to-refresh";

describe("shouldActivatePullToRefresh", () => {
  it("returns false when hook is disabled", () => {
    expect(
      shouldActivatePullToRefresh({
        disabled: true,
        scrollY: 0,
        touchInsideDragRegion: false,
      }),
    ).toBe(false);
  });

  it("returns false when page is scrolled", () => {
    expect(
      shouldActivatePullToRefresh({
        disabled: false,
        scrollY: 20,
        touchInsideDragRegion: false,
      }),
    ).toBe(false);
  });

  it("returns false when touch starts inside drag region", () => {
    expect(
      shouldActivatePullToRefresh({
        disabled: false,
        scrollY: 0,
        touchInsideDragRegion: true,
      }),
    ).toBe(false);
  });

  it("returns true only for top-of-page non-drag touches", () => {
    expect(
      shouldActivatePullToRefresh({
        disabled: false,
        scrollY: 0,
        touchInsideDragRegion: false,
      }),
    ).toBe(true);
  });
});
