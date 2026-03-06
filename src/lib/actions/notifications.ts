"use server";

import { createClient } from "@/lib/supabase/server";
import { pushSubscriptionSchema } from "@/lib/validations/notifications";

interface SubscribeResult {
  success: boolean;
  error?: string;
}

/**
 * Save a Web Push subscription to the database for the current user.
 * Validates the subscription payload with Zod before persisting.
 */
export async function subscribePush(
  rawSubscription: unknown,
): Promise<SubscribeResult> {
  const parsed = pushSubscriptionSchema.safeParse(rawSubscription);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid subscription data",
    };
  }

  const { endpoint, keys } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: upsertError } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "user_id,endpoint" },
    );

  if (upsertError) {
    return { success: false, error: upsertError.message };
  }

  // Also set notification_enabled = true on the profile
  await supabase
    .from("profiles")
    .update({ notification_enabled: true })
    .eq("id", user.id);

  return { success: true };
}

/**
 * Remove a Web Push subscription for the current user.
 */
export async function unsubscribePush(
  endpoint: string,
): Promise<SubscribeResult> {
  if (!endpoint || typeof endpoint !== "string") {
    return { success: false, error: "Invalid endpoint" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: deleteError } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Check if user has any remaining subscriptions
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // If no subscriptions remain, disable notifications on profile
  if (count === 0) {
    await supabase
      .from("profiles")
      .update({ notification_enabled: false })
      .eq("id", user.id);
  }

  return { success: true };
}

/**
 * Check if the current user has any active push subscriptions.
 */
export async function hasActivePushSubscription(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (count ?? 0) > 0;
}
