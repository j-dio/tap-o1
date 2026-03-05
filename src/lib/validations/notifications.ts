import { z } from "zod";

/**
 * Zod schema for a Web Push subscription's `keys` object.
 */
export const pushSubscriptionKeysSchema = z.object({
  p256dh: z
    .string()
    .min(1, "p256dh key is required")
    .regex(/^[A-Za-z0-9_-]+={0,2}$/, "p256dh must be base64url-encoded"),
  auth: z
    .string()
    .min(1, "auth key is required")
    .regex(/^[A-Za-z0-9_-]+={0,2}$/, "auth must be base64url-encoded"),
});

/**
 * Zod schema for a Web Push subscription payload sent from the client.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL"),
  keys: pushSubscriptionKeysSchema,
});

export type PushSubscriptionPayload = z.infer<typeof pushSubscriptionSchema>;

/**
 * Represents a push subscription row stored in Supabase.
 */
export interface PushSubscriptionRow {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

/**
 * Represents a notification log row stored in Supabase.
 */
export interface NotificationLogRow {
  id: string;
  userId: string;
  taskId: string;
  sentAt: string;
  type: string;
}

/**
 * Payload sent inside a Web Push notification.
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  timestamp?: number;
}

/**
 * Result from the send-due-reminders Edge Function.
 */
export interface SendRemindersResult {
  sent: number;
  failed: number;
  cleaned: number;
}
