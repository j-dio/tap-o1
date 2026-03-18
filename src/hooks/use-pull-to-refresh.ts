"use client";

import { useCallback, useMemo, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface PullToRefreshActivationArgs {
  disabled: boolean;
  scrollY: number;
  touchInsideDragRegion: boolean;
}

const DRAG_REGION_SELECTOR = "[data-dnd-drag-region='true']";

export function shouldActivatePullToRefresh({
  disabled,
  scrollY,
  touchInsideDragRegion,
}: PullToRefreshActivationArgs): boolean {
  if (disabled) return false;
  if (scrollY > 0) return false;
  if (touchInsideDragRegion) return false;

  return true;
}

function isTouchInsideDragRegion(target: EventTarget | null): boolean {
  if (typeof Element === "undefined") return false;
  if (!(target instanceof Element)) return false;

  return target.closest(DRAG_REGION_SELECTOR) !== null;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions) {
  const startYRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const canActivate = shouldActivatePullToRefresh({
        disabled,
        scrollY: window.scrollY,
        touchInsideDragRegion: isTouchInsideDragRegion(event.target),
      });

      if (!canActivate) {
        startYRef.current = null;
        activeRef.current = false;
        return;
      }

      startYRef.current = event.touches[0]?.clientY ?? null;
      activeRef.current = true;
      setIsReady(false);
    },
    [disabled],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!activeRef.current || startYRef.current === null) return;

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const rawDelta = currentY - startYRef.current;
      const nextDistance = Math.max(0, Math.min(rawDelta, maxPull));

      setPullDistance(nextDistance);
      setIsReady(nextDistance >= threshold);
    },
    [maxPull, threshold],
  );

  const reset = useCallback(() => {
    activeRef.current = false;
    startYRef.current = null;
    setPullDistance(0);
    setIsReady(false);
  }, []);

  const onTouchEnd = useCallback(async () => {
    const shouldRefresh = activeRef.current && pullDistance >= threshold;
    reset();

    if (!shouldRefresh || disabled) return;
    await onRefresh();
  }, [disabled, onRefresh, pullDistance, reset, threshold]);

  const bind = useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: reset,
    }),
    [onTouchEnd, onTouchMove, onTouchStart, reset],
  );

  return {
    bind,
    pullDistance,
    isReady,
  };
}
