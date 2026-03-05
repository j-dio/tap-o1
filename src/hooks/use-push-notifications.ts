"use client";

import { useState, useEffect, useCallback } from "react";
import { subscribePush, unsubscribePush } from "@/lib/actions/notifications";

type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

interface UsePushNotificationsReturn {
  /** Whether push notifications are supported in this browser. */
  isSupported: boolean;
  /** Current browser notification permission state. */
  permission: PushPermissionState;
  /** Whether the user is currently subscribed to push. */
  isSubscribed: boolean;
  /** Whether a subscribe/unsubscribe operation is in progress. */
  isLoading: boolean;
  /** Error message from the last operation, if any. */
  error: string | null;
  /** Subscribe to push notifications (requests permission if needed). */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications. */
  unsubscribe: () => Promise<void>;
}

/**
 * Convert a base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook to manage Web Push notification subscriptions.
 *
 * Handles permission requests, subscribe/unsubscribe via server actions,
 * and tracks subscription state.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Check current permission and subscription state on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(subscription !== null);
      })
      .catch(() => {
        // SW not ready yet — will retry when user clicks subscribe
      });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result !== "granted") {
        setError(
          "Notification permission denied. Please enable notifications in browser settings.",
        );
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Push notification configuration is missing");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        setError("Failed to create push subscription");
        return;
      }

      // Save subscription to server
      const serverResult = await subscribePush({
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
      });

      if (!serverResult.success) {
        // Roll back the browser subscription if server save fails
        await subscription.unsubscribe();
        setError(serverResult.error ?? "Failed to save subscription");
        return;
      }

      setIsSubscribed(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const { endpoint } = subscription;

        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        const serverResult = await unsubscribePush(endpoint);
        if (!serverResult.success) {
          setError(serverResult.error ?? "Failed to remove subscription");
        }
      }

      setIsSubscribed(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}
