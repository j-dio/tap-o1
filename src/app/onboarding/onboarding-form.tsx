"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Link2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { saveUvecIcalUrl } from "@/lib/actions/auth";
import { uvecIcalUrlSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SETUP_STEPS = [
  {
    step: 1,
    title: "Google sign-in",
    helper: "Connected. You are ready to sync Google Classroom tasks.",
  },
  {
    step: 2,
    title: "Add your UVEC calendar link",
    helper: "Paste the UVEC export URL so we can import assignments.",
  },
  {
    step: 3,
    title: "Finish and sync",
    helper: "We save your link and take you to your dashboard to sync.",
  },
] as const;

const ICAL_STEPS = [
  {
    step: 1,
    title: "Open UVEC",
    description:
      'Go to your UVEC dashboard and click on "Calendar" in the navigation menu.',
  },
  {
    step: 2,
    title: "Export Calendar",
    description:
      'Click the "Export calendar" button (or import/export icon) at the bottom of the calendar page.',
  },
  {
    step: 3,
    title: "Configure Export",
    description:
      'Set "All events" for the export type and choose a wide date range to include all assignments.',
  },
  {
    step: 4,
    title: "Copy the URL",
    description:
      'Click "Get calendar URL" and copy the entire URL. It should start with https:// and contain "export_execute.php".',
  },
] as const;

type StepState = "complete" | "active" | "pending";

function getUrlHelperText(value: string, isValid: boolean) {
  if (!value) {
    return "Tip: Copy the full export link from UVEC. It usually contains export_execute.php.";
  }

  if (isValid) {
    return "This looks valid. Continue to connect UVEC.";
  }

  if (value.startsWith("http://")) {
    return "Use the secure https:// URL from UVEC.";
  }

  if (!value.includes("export") && !value.includes("ical")) {
    return "This link may be incomplete. Try copying the full export URL again.";
  }

  return "Double-check the link format. The guide above shows where to copy it.";
}

function StepChip({
  step,
  title,
  helper,
  state,
  delay,
}: {
  step: number;
  title: string;
  helper: string;
  state: StepState;
  delay: string;
}) {
  return (
    <li
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-1 rounded-xl border p-3 transition-all motion-safe:duration-300 motion-reduce:animate-none",
        state === "complete" && "border-success/35 bg-success/10",
        state === "active" &&
          "border-primary/45 bg-primary/8 shadow-primary/10 shadow-sm",
        state === "pending" && "border-border bg-muted/35",
      )}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            state === "complete" &&
              "border-success bg-success text-success-foreground",
            state === "active" &&
              "border-primary bg-primary text-primary-foreground",
            state === "pending" &&
              "border-input bg-background text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {state === "complete" ? <Check className="size-3.5" /> : step}
        </div>
        <div className="space-y-1">
          <p className="text-sm leading-tight font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {helper}
          </p>
        </div>
      </div>
    </li>
  );
}

function StatusBanner({
  tone,
  title,
  description,
}: {
  tone: "info" | "error" | "success";
  title: string;
  description: string;
}) {
  const icon =
    tone === "error" ? (
      <AlertCircle className="size-4" />
    ) : tone === "success" ? (
      <CheckCircle2 className="size-4" />
    ) : (
      <Info className="size-4" />
    );

  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 rounded-lg border px-3 py-2.5 text-sm motion-safe:duration-200 motion-reduce:animate-none",
        tone === "info" && "border-info/35 bg-info/8 text-foreground",
        tone === "error" &&
          "border-destructive/35 bg-destructive/8 text-foreground",
        tone === "success" && "border-success/35 bg-success/10 text-foreground",
      )}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex gap-2">
        <span
          className={cn(
            "mt-0.5",
            tone === "error" && "text-destructive",
            tone === "success" && "text-success",
            tone === "info" && "text-info",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function OnboardingForm({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "success">(
    "idle",
  );

  const trimmedUrl = url.trim();
  const parsedUrl = uvecIcalUrlSchema.safeParse(trimmedUrl);
  const isUrlValid = trimmedUrl.length > 0 && parsedUrl.success;
  const activeStep =
    submitState === "success" ||
    submitState === "saving" ||
    isPending ||
    isUrlValid
      ? 3
      : 2;

  const stepStates = SETUP_STEPS.map((step) => {
    const state: StepState =
      step.step === 1
        ? "complete"
        : step.step === 2
          ? isUrlValid
            ? "complete"
            : activeStep === 2
              ? "active"
              : "pending"
          : submitState === "success"
            ? "complete"
            : activeStep === 3
              ? "active"
              : "pending";

    return {
      ...step,
      state,
    };
  });

  const guideFocusStep = trimmedUrl ? 4 : 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const candidate = url.trim();
    const result = uvecIcalUrlSchema.safeParse(candidate);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setSubmitState("idle");
      setError(firstError?.message ?? "Invalid URL");
      return;
    }

    setSubmitState("saving");

    startTransition(async () => {
      const response = await saveUvecIcalUrl(result.data);

      if (response.error) {
        setSubmitState("idle");
        setError(response.error);
        return;
      }

      setSubmitState("success");
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/dashboard");
    });
  }

  function handleSkip() {
    router.push("/dashboard");
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-5">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Let&apos;s finish setup so your assignments are easier to track in one
          place.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        <Card className="border-primary/25 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Setup progress</CardTitle>
            <CardDescription>
              Follow these steps. We&apos;ll guide you to the dashboard sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {stepStates.map(({ step, title, helper, state }, index) => (
                <StepChip
                  key={step}
                  step={step}
                  title={title}
                  helper={helper}
                  state={state}
                  delay={`${index * 70}ms`}
                />
              ))}
            </ol>

            <div className="border-border/70 bg-muted/35 mt-4 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                What happens next
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex gap-2">
                  <Check className="text-success mt-0.5 size-4 shrink-0" />
                  Google sign-in is done. Classroom data syncs on dashboard.
                </li>
                <li className="flex gap-2">
                  <Link2 className="text-primary mt-0.5 size-4 shrink-0" />
                  Add your UVEC calendar URL to include Moodle assignments.
                </li>
                <li className="flex gap-2">
                  <Sparkles className="text-info mt-0.5 size-4 shrink-0" />
                  You can still use the app now and finish UVEC later.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-reduce:animate-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-success/20 flex size-8 items-center justify-center rounded-full">
                  <Check className="text-success size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Classroom</CardTitle>
                  <CardDescription>
                    Connected with Google Sign-In. First sync starts on your
                    dashboard.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-primary/30 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-reduce:animate-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full">
                  <Calendar className="text-primary size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">UVEC (Moodle)</CardTitle>
                  <CardDescription>
                    Add your calendar export link so UVEC assignments appear in
                    your board.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium"
              >
                <ChevronRight
                  className={cn(
                    "size-4 transition-transform motion-reduce:transition-none",
                    showGuide && "rotate-90",
                  )}
                />
                {showGuide ? "Hide" : "Show"} setup steps
              </button>

              {showGuide && (
                <div className="bg-muted/40 grid gap-2 rounded-xl border p-3">
                  {ICAL_STEPS.map(({ step, title, description }, index) => {
                    const itemState: StepState =
                      step < guideFocusStep
                        ? "complete"
                        : step === guideFocusStep
                          ? "active"
                          : "pending";

                    return (
                      <div
                        key={step}
                        className={cn(
                          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-1 rounded-lg border p-2.5 transition-all motion-safe:duration-250 motion-reduce:animate-none",
                          itemState === "complete" &&
                            "border-success/35 bg-success/10",
                          itemState === "active" &&
                            "border-primary/40 bg-primary/10",
                          itemState === "pending" && "border-border bg-card/70",
                        )}
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                              itemState === "complete" &&
                                "border-success bg-success text-success-foreground",
                              itemState === "active" &&
                                "border-primary bg-primary text-primary-foreground",
                              itemState === "pending" &&
                                "border-input bg-background text-muted-foreground",
                            )}
                            aria-hidden="true"
                          >
                            {itemState === "complete" ? (
                              <Check className="size-3.5" />
                            ) : (
                              step
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{title}</p>
                            <p className="text-muted-foreground text-sm">
                              {description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {submitState === "saving" && (
                <StatusBanner
                  tone="info"
                  title="Connecting UVEC..."
                  description="We are saving your link and preparing your first sync."
                />
              )}
              {submitState === "success" && (
                <StatusBanner
                  tone="success"
                  title="UVEC connected"
                  description="Great! Taking you to your dashboard now."
                />
              )}
              {error && (
                <StatusBanner
                  tone="error"
                  title="Could not connect this URL"
                  description={error}
                />
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div
                  className={cn(
                    "rounded-xl border p-3 transition-colors motion-reduce:transition-none",
                    isInputFocused
                      ? "border-primary/45 bg-primary/5"
                      : "border-border bg-background",
                  )}
                >
                  <label
                    htmlFor="uvec-url"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    UVEC calendar export URL
                  </label>
                  <input
                    id="uvec-url"
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                      if (submitState === "success") {
                        setSubmitState("idle");
                      }
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="https://your-school.edu/.../export_execute.php?..."
                    className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
                    disabled={isPending}
                    autoComplete="off"
                  />
                  <p
                    className={cn(
                      "mt-1.5 text-xs",
                      isUrlValid ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {getUrlHelperText(trimmedUrl, isUrlValid)}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !trimmedUrl}
                  size="lg"
                  className="shadow-primary/20 h-11 font-semibold shadow-sm transition-all motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-reduce:transform-none"
                >
                  {isPending || submitState === "saving" ? (
                    <>
                      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                      Connecting UVEC...
                    </>
                  ) : submitState === "success" ? (
                    <>
                      <Check className="size-4" />
                      UVEC connected
                    </>
                  ) : (
                    "Connect UVEC"
                  )}
                </Button>
                <p className="text-muted-foreground text-xs">
                  Your link is validated and stored securely in your profile.
                </p>
              </form>
            </CardContent>
          </Card>

          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            disabled={isPending}
          >
            Skip for now - I&apos;ll connect UVEC later
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs lg:text-left">
        We support offline-friendly viewing for recently loaded data, but setup
        and syncing still require an internet connection.
      </p>
    </div>
  );
}
