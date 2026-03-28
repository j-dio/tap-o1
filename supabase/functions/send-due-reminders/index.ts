/**
 * Supabase Edge Function: send-due-reminders
 *
 * Runs on a cron schedule (every 15 minutes). For each user with
 * notification_enabled = true, finds tasks due within 24 hours that
 * have not yet been notified, sends a Web Push notification, and logs
 * the notification. Automatically cleans up stale subscriptions (410 Gone).
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_SUBJECT
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sendWebPush,
  type PushSubscription,
  type SendPushResult,
} from "./web-push.ts";

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
  course_name?: string;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

function formatDueLabel(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 0) return "overdue";
  if (diffHours <= 1) return "in less than 1 hour";
  if (diffHours <= 24) return `in ${diffHours} hours`;
  return `in ${Math.round(diffHours / 24)} days`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidPublicKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const vapidSubject =
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@task-aggregator.app";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!vapidPrivateKey || !vapidPublicKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing required environment variables" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Find tasks due within 24 hours that haven't been notified yet,
  //    excluding tasks the user has already marked done/dismissed via overrides.
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: allDueTasks } = await supabase
    .from("tasks")
    .select(
      `
      id,
      user_id,
      title,
      due_date,
      courses ( name ),
      task_overrides ( custom_status )
    `,
    )
    .gte("due_date", now.toISOString())
    .lte("due_date", in24Hours.toISOString())
    .in("status", ["pending", "in_progress"]);

  let tasksToNotify: TaskRow[] = [];

  if (allDueTasks && allDueTasks.length > 0) {
    const taskIds = allDueTasks.map((t: { id: string }) => t.id);
    const { data: existingLogs } = await supabase
      .from("notification_log")
      .select("task_id")
      .in("task_id", taskIds)
      .eq("type", "due_reminder");

    const notifiedTaskIds = new Set(
      (existingLogs ?? []).map((l: { task_id: string }) => l.task_id),
    );

    tasksToNotify = allDueTasks
      .filter((t: { id: string; task_overrides?: { custom_status: string | null }[] }) => {
        if (notifiedTaskIds.has(t.id)) return false;
        // Exclude tasks the user has already resolved via an override
        const customStatus = t.task_overrides?.[0]?.custom_status;
        return customStatus !== "done" && customStatus !== "dismissed";
      })
      .map((t: Record<string, unknown>) => ({
        id: t.id as string,
        user_id: t.user_id as string,
        title: t.title as string,
        due_date: t.due_date as string,
        course_name: (t.courses as { name?: string } | null)?.name,
      }));
  }

  if (tasksToNotify.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, cleaned: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Group tasks by user_id
  const tasksByUser = new Map<string, TaskRow[]>();
  for (const task of tasksToNotify) {
    const existing = tasksByUser.get(task.user_id) ?? [];
    tasksByUser.set(task.user_id, [...existing, task]);
  }

  // 3. Only process users who have notification_enabled
  const userIds = [...tasksByUser.keys()];
  const { data: enabledProfiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .eq("notification_enabled", true);

  const enabledUserIds = new Set(
    (enabledProfiles ?? []).map((p: { id: string }) => p.id),
  );

  // 4. Fetch subscriptions for enabled users
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", [...enabledUserIds]);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, cleaned: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Group subscriptions by user_id
  const subsByUser = new Map<string, SubscriptionRow[]>();
  for (const sub of subscriptions as SubscriptionRow[]) {
    const existing = subsByUser.get(sub.user_id) ?? [];
    subsByUser.set(sub.user_id, [...existing, sub]);
  }

  // 5. Send notifications
  let sent = 0;
  let failed = 0;
  let cleaned = 0;
  const notificationLogs: { user_id: string; task_id: string; type: string }[] =
    [];
  const staleSubIds: string[] = [];

  for (const [userId, tasks] of tasksByUser.entries()) {
    if (!enabledUserIds.has(userId)) continue;

    const userSubs = subsByUser.get(userId);
    if (!userSubs || userSubs.length === 0) continue;

    for (const task of tasks) {
      const dueLabel = formatDueLabel(task.due_date);
      const coursePrefix = task.course_name ? `[${task.course_name}] ` : "";

      const payload = JSON.stringify({
        title: "Task Due Soon",
        body: `${coursePrefix}${task.title} — due ${dueLabel}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `due-reminder-${task.id}`,
        url: "/dashboard",
        timestamp: Date.now(),
      });

      let taskNotified = false;

      for (const sub of userSubs) {
        const pushSub: PushSubscription = {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        };

        let result: SendPushResult;
        try {
          result = await sendWebPush(
            pushSub,
            payload,
            vapidPrivateKey,
            vapidPublicKey,
            vapidSubject,
          );
        } catch {
          failed++;
          continue;
        }

        if (result.success) {
          taskNotified = true;
          sent++;
        } else if (result.gone) {
          staleSubIds.push(sub.id);
          cleaned++;
        } else {
          failed++;
        }
      }

      if (taskNotified) {
        notificationLogs.push({
          user_id: userId,
          task_id: task.id,
          type: "due_reminder",
        });
      }
    }
  }

  // 6. Log sent notifications (upsert to handle unique constraint)
  if (notificationLogs.length > 0) {
    await supabase.from("notification_log").upsert(notificationLogs, {
      onConflict: "user_id,task_id,type",
      ignoreDuplicates: true,
    });
  }

  // 7. Clean up stale subscriptions (410 Gone)
  if (staleSubIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleSubIds);
  }

  return new Response(JSON.stringify({ sent, failed, cleaned }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
