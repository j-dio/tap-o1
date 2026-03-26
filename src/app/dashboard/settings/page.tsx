"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uvecIcalUrlSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  Download,
  Smartphone,
} from "lucide-react";
import { NotificationSettings } from "@/components/notification-settings";
import { usePwaInstall } from "@/components/add-to-homescreen-prompt";

export default function SettingsPage() {
  const { canInstall, install, isIos, isStandalone, wasDismissed, resetDismissed } = usePwaInstall();
  const [uvecUrl, setUvecUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [hasGoogleRefreshToken, setHasGoogleRefreshToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Surface reconnect failure from the OAuth callback
    if (searchParams.get("google_reconnect") === "failed") {
      setSaveMessage({
        ok: false,
        text: "Google reconnect did not complete — the refresh token could not be saved. Please try again.",
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }

      supabase
        .from("profiles")
        .select("uvec_ical_url, google_refresh_token")
        .eq("id", session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setUvecUrl(profile.uvec_ical_url ?? "");
            setSavedUrl(profile.uvec_ical_url ?? null);
            setHasGoogleRefreshToken(!!profile.google_refresh_token);
          }
          setLoading(false);
        });
    });
  }, [supabase, searchParams]);

  async function handleSaveUvec() {
    setSaving(true);
    setSaveMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSaveMessage({ ok: false, text: "Not authenticated." });
      setSaving(false);
      return;
    }

    const trimmed = uvecUrl.trim();

    // Allow clearing the URL
    if (trimmed) {
      const validation = uvecIcalUrlSchema.safeParse(trimmed);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        setSaveMessage({
          ok: false,
          text: firstIssue?.message ?? "Invalid URL",
        });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ uvec_ical_url: trimmed || null })
      .eq("id", session.user.id);

    if (error) {
      setSaveMessage({ ok: false, text: `Failed to save: ${error.message}` });
    } else {
      setSavedUrl(trimmed || null);
      setSaveMessage({ ok: true, text: "UVEC URL saved!" });
    }
    setSaving(false);
  }

  async function handleTestUvec() {
    setTesting(true);
    setTestResult(null);

    // Force-refresh the session to get a valid JWT
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    const session = refreshData?.session;
    if (refreshError || !session) {
      setTestResult({
        ok: false,
        message: "Not authenticated. Please sign out and sign back in.",
      });
      setTesting(false);
      return;
    }

    const trimmed = uvecUrl.trim();
    if (!trimmed) {
      setTestResult({ ok: false, message: "No URL to test." });
      setTesting(false);
      return;
    }

    try {
      const proxyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uvec-proxy?icalUrl=${encodeURIComponent(trimmed)}`;
      const resp = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        let detail = body;
        try {
          const parsed = JSON.parse(body);
          detail = parsed.error ?? parsed.message ?? body;
          if (parsed.hint) detail += ` ${parsed.hint}`;
        } catch {
          // body isn't JSON, use as-is
        }
        setTestResult({
          ok: false,
          message: `Proxy returned ${resp.status}. ${detail}`,
        });
      } else {
        const text = await resp.text();
        if (text.includes("BEGIN:VCALENDAR")) {
          const eventCount = (text.match(/BEGIN:VEVENT/g) || []).length;
          setTestResult({
            ok: true,
            message: `Connected! Found ${eventCount} calendar events.`,
          });
        } else {
          setTestResult({
            ok: false,
            message: "Response is not a valid iCal feed.",
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      // Provide actionable guidance for network errors
      if (message.includes("NetworkError") || message.includes("fetch")) {
        setTestResult({
          ok: false,
          message:
            "Cannot reach the sync proxy. Make sure the Edge Function is deployed: run `supabase functions deploy uvec-proxy` in your terminal.",
        });
      } else {
        setTestResult({ ok: false, message });
      }
    }

    setTesting(false);
  }

  async function handleReconnectGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
          "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
        ].join(" "),
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setSaveMessage({
        ok: false,
        text: `Google reconnect failed: ${error.message}`,
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your data sources and sync configuration.
        </p>
      </div>

      {/* UVEC Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>UVEC (Moodle Calendar)</CardTitle>
            {savedUrl ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <XCircle className="text-muted-foreground size-5" />
            )}
          </div>
          <CardDescription>
            Paste your UVEC iCal export URL to sync Moodle calendar events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Input
              placeholder="https://uvec.upcebu.edu.ph/calendar/export_execute.php?..."
              value={uvecUrl}
              onChange={(e) => {
                setUvecUrl(e.target.value);
                setTestResult(null);
                setSaveMessage(null);
              }}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveUvec} disabled={saving} size="sm">
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save URL
              </Button>
              <Button
                variant="outline"
                onClick={handleTestUvec}
                disabled={testing || !uvecUrl.trim()}
                size="sm"
              >
                {testing && <Loader2 className="mr-2 size-4 animate-spin" />}
                Test Connection
              </Button>
            </div>
          </div>

          {saveMessage && (
            <p
              className={`text-sm ${saveMessage.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
            >
              {saveMessage.text}
            </p>
          )}

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                testResult.ok
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* How-to collapsible */}
          <button
            type="button"
            onClick={() => setShowHelp((h) => !h)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronDown
              className={`size-4 transition-transform ${showHelp ? "rotate-180" : ""}`}
            />
            How to get your UVEC iCal URL
          </button>
          {showHelp && (
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 pl-1 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://uvec.upcebu.edu.ph/calendar/export.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  UVEC Calendar Export
                </a>
              </li>
              <li>
                Select <strong>All events</strong> and{" "}
                <strong>This month</strong> (or your preferred range)
              </li>
              <li>
                Click <strong>Export</strong>
              </li>
              <li>
                Copy the URL from the download link (right-click → Copy Link)
              </li>
              <li>Paste the full URL above</li>
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Google Classroom Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Google Classroom</CardTitle>
            {hasGoogleRefreshToken ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <XCircle className="text-muted-foreground size-5" />
            )}
          </div>
          <CardDescription>
            {hasGoogleRefreshToken
              ? "Google Classroom is connected. Tasks will sync automatically."
              : "Google Classroom is not connected. Click below to authorize."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={hasGoogleRefreshToken ? "outline" : "default"}
            onClick={handleReconnectGoogle}
            size="sm"
          >
            <ExternalLink className="mr-2 size-4" />
            {hasGoogleRefreshToken
              ? "Reconnect Google"
              : "Connect Google Classroom"}
          </Button>
          {hasGoogleRefreshToken && (
            <p className="text-muted-foreground mt-2 text-xs">
              Reconnecting will refresh your authorization. Use this if sync
              stops working.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <NotificationSettings />

      {/* Install App */}
      {!isStandalone && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Install App</CardTitle>
              <Smartphone className="text-muted-foreground size-5" />
            </div>
            <CardDescription>
              Add TapO(1) to your home screen for a faster, offline-capable experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isIos ? (
              <p className="text-muted-foreground text-sm">
                On iPhone/iPad: tap the{" "}
                <strong>Share</strong> button in Safari, then{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : canInstall ? (
              <Button size="sm" onClick={install}>
                <Download className="mr-2 size-4" />
                Install App
              </Button>
            ) : wasDismissed ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  You dismissed the install prompt. Click below to enable it again.
                </p>
                <Button size="sm" variant="outline" onClick={resetDismissed}>
                  Re-enable install prompt
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Install option is not available in this browser, or the app is already installed.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
