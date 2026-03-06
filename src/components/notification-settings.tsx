"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, BellOff, Loader2, AlertTriangle, Info } from "lucide-react";

/**
 * Notification settings card for the settings page.
 * Handles subscribe/unsubscribe to Web Push notifications.
 */
export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Push Notifications</CardTitle>
          {isSubscribed ? (
            <Bell className="size-5 text-green-500" />
          ) : (
            <BellOff className="text-muted-foreground size-5" />
          )}
        </div>
        <CardDescription>
          Get notified when tasks are due soon. Reminders are sent for tasks due
          within 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="bg-muted/50 flex items-start gap-2 rounded-md p-3 text-sm">
            <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Not supported</p>
              <p className="text-muted-foreground">
                Push notifications are not supported in this browser. On iOS,
                please add this app to your Home Screen first.
              </p>
            </div>
          </div>
        ) : permission === "denied" ? (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Permission blocked</p>
              <p>
                Notifications have been blocked. To enable them, open your
                browser settings and allow notifications for this site.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                <BellOff className="mr-2 size-4" />
                Disable Notifications
              </Button>
            ) : (
              <Button size="sm" onClick={subscribe} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Bell className="mr-2 size-4" />
                Enable Notifications
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {isSubscribed
                ? "You will receive reminders for upcoming deadlines."
                : "Click to enable deadline reminders."}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
