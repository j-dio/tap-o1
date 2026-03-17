"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Target,
  Plus,
  RefreshCw,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";

const TOUR_COMPLETED_KEY = "onboarding-tour-completed";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to TapO(1)!",
    description:
      "Your tasks from UVEC and Google Classroom are synced here automatically. Let's take a quick tour of the key features.",
    icon: <AppLogo className="size-10" />,
  },
  {
    title: "Kanban Board",
    description:
      "Your tasks are organized into three columns: To Do, In Progress, and Done. Drag and drop tasks between columns to update their status.",
    icon: <GripVertical className="size-10 text-primary" />,
  },
  {
    title: "Focus Mode",
    description:
      "Feeling overwhelmed? Toggle Focus Mode to see only tasks due within the next 24 hours. Find it in the toolbar above the board.",
    icon: <Target className="size-10 text-warning" />,
  },
  {
    title: "Custom Tasks",
    description:
      'Need to track something not in UVEC or Google Classroom? Click "New task" to create your own tasks with custom due dates and priorities.',
    icon: <Plus className="size-10 text-success" />,
  },
  {
    title: "Sync & Calendar",
    description:
      "Hit the sync button anytime to pull the latest tasks. You can also switch to the Calendar view from the sidebar for a monthly overview.",
    icon: (
      <div className="flex gap-2">
        <RefreshCw className="size-8 text-primary" />
        <Calendar className="size-8 text-primary" />
      </div>
    ),
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setVisible(false);
  }

  function next() {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card animate-in fade-in-0 zoom-in-95 relative w-full max-w-md rounded-2xl border p-6 shadow-xl duration-200">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
          aria-label="Skip tour"
        >
          <X className="size-4" />
        </button>

        {/* Step indicator */}
        <div className="mb-6 flex justify-center gap-1.5">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-primary w-6"
                  : i < step
                    ? "bg-primary/40 w-1.5"
                    : "bg-muted w-1.5"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mb-4 flex justify-center">{current.icon}</div>

        {/* Content */}
        <h2 className="mb-2 text-center text-lg font-bold tracking-tight">
          {current.title}
        </h2>
        <p className="text-muted-foreground mb-6 text-center text-sm leading-relaxed">
          {current.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>

          <span className="text-muted-foreground text-xs">
            {step + 1} of {tourSteps.length}
          </span>

          <Button size="sm" onClick={next} className="gap-1">
            {isLast ? "Get started" : "Next"}
            {!isLast && <ArrowRight className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
