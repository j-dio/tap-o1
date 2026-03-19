import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  WifiOff,
  PlusCircle,
  ArrowRight,
  Zap,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppLogo } from "@/components/app-logo";

const GITHUB_README_URL = "https://github.com/j-dio/task-aggregator#readme";

const steps = [
  {
    n: 1,
    title: "Sign in with Google",
    desc: "Use your UP Cebu Google account — no separate password.",
    icon: GraduationCap,
  },
  {
    n: 2,
    title: "Connect UVEC Moodle",
    desc: "Paste your UVEC iCal URL once; tasks sync automatically.",
    icon: BookOpen,
  },
  {
    n: 3,
    title: "Sync Google Classroom",
    desc: "Grant Classroom access — assignments import in seconds.",
    icon: ArrowRight,
  },
];

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Drag-and-Drop Board",
    desc: "Prioritise your week with a Kanban board — move tasks between To-Do, In Progress, and Done.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    desc: "Installed as a PWA, TapO(1) loads and lets you check tasks even without internet.",
  },
  {
    icon: PlusCircle,
    title: "Custom Tasks",
    desc: "Add tasks that aren't in any platform — study sessions, personal deadlines, anything.",
  },
];

export const metadata = { title: "TapO(1) — Academic Task Aggregator" };

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <style>{`
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes lp-pulse-glow {
          0%, 100% {
            filter:
              drop-shadow(0 18px 44px oklch(0.178 0.022 265 / 28%))
              drop-shadow(0 0 24px oklch(0.178 0.022 265 / 24%));
          }
          50% {
            filter:
              drop-shadow(0 24px 58px oklch(0.178 0.022 265 / 42%))
              drop-shadow(0 0 40px oklch(0.178 0.022 265 / 36%));
          }
        }
        @keyframes lp-pulse-glow-dark {
          0%, 100% {
            filter:
              drop-shadow(0 18px 44px oklch(0.68 0.18 25 / 30%))
              drop-shadow(0 0 26px oklch(0.68 0.18 25 / 26%));
          }
          50% {
            filter:
              drop-shadow(0 24px 58px oklch(0.68 0.18 25 / 46%))
              drop-shadow(0 0 44px oklch(0.68 0.18 25 / 38%));
          }
        }
        .lp-logo {
          animation: lp-float 3.5s ease-in-out infinite;
          will-change: transform;
        }
        .lp-logo > img {
          animation: lp-pulse-glow 3s ease-in-out infinite;
          will-change: filter;
        }
        .dark .lp-logo > img {
          animation-name: lp-pulse-glow-dark;
        }
        .lp-s1 { animation: lp-fade-up 0.6s ease-out 0.05s both; }
        .lp-s1.lp-logo {
          animation: lp-fade-up 0.6s ease-out 0.05s both, lp-float 3.5s ease-in-out 0.65s infinite;
        }
        .lp-s2 { animation: lp-fade-up 0.6s ease-out 0.18s both; }
        .lp-s3 { animation: lp-fade-up 0.6s ease-out 0.30s both; }
        .lp-s4 { animation: lp-fade-up 0.6s ease-out 0.42s both; }
        .lp-s5 { animation: lp-fade-up 0.6s ease-out 0.54s both; }
        .lp-s6 { animation: lp-fade-up 0.6s ease-out 0.66s both; }
        .lp-feature-card {
          transition: transform 280ms ease, box-shadow 280ms ease;
        }
        .lp-feature-card:hover {
          transform: translateY(-5px);
        }
        .lp-grid-bg {
          background-image:
            linear-gradient(oklch(0.178 0.022 265 / 4%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.178 0.022 265 / 4%) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .dark .lp-grid-bg {
          background-image:
            linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .lp-step-line {
          position: absolute;
          top: 20px;
          left: calc(100% / 6);
          right: calc(100% / 6);
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            oklch(0.178 0.022 265 / 20%) 20%,
            oklch(0.178 0.022 265 / 20%) 80%,
            transparent
          );
        }
        .dark .lp-step-line {
          background: linear-gradient(
            90deg,
            transparent,
            oklch(1 0 0 / 15%) 20%,
            oklch(1 0 0 / 15%) 80%,
            transparent
          );
        }
        .lp-badge {
          animation: lp-fade-in 0.5s ease-out 0.8s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-logo, .lp-logo > img { animation: none; }
          .lp-s1, .lp-s2, .lp-s3, .lp-s4, .lp-s5, .lp-s6, .lp-badge {
            animation: none; opacity: 1;
          }
        }
      `}</style>

      <div className="bg-background relative min-h-screen overflow-x-hidden">
        {/* Grid background */}
        <div className="lp-grid-bg pointer-events-none absolute inset-0" />

        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="bg-primary/6 h-125 w-175 rounded-full blur-[120px]" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6">
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-6 pt-20 pb-16 text-center">
            {/* Logo badge */}
            <AppLogo className="lp-s1 lp-logo size-24 overflow-visible rounded-full sm:size-28" />

            {/* Headline */}
            <div className="lp-s2 flex flex-col gap-2">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                TapO(1)
              </h1>
              <p className="text-primary text-xl font-semibold">
                Academic tracking in constant time.
              </p>
            </div>

            {/* Sub-text */}
            <p className="lp-s3 text-muted-foreground mx-auto max-w-md text-base leading-relaxed">
              TapO(1) pulls your tasks from UVEC and Google Classroom into a
              single drag-and-drop board. Maximum laziness, constant efficiency!
            </p>

            {/* CTA buttons */}
            <div className="lp-s4 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/login">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href={GITHUB_README_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Self-hosting guide
                </a>
              </Button>
            </div>

            {/* Complexity pill */}
            <div className="lp-badge bg-muted border-border text-muted-foreground rounded-full border px-4 py-1.5 font-mono text-xs">
              <Zap className="mr-1.5 mb-px inline size-3 text-yellow-500" />
              O(1) access · no context-switching · always in sync
            </div>
          </section>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="lp-s4 border-border w-full border-t" />

          {/* ── How it works ──────────────────────────────────────────── */}
          <section className="lp-s5 w-full py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold">Up in under a minute</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Three steps and you&apos;re done.
              </p>
            </div>

            {/* Steps */}
            <div className="relative flex flex-col gap-6 md:flex-row md:gap-0">
              {/* Connector line — desktop only */}
              <div className="lp-step-line hidden md:block" />

              {steps.map(({ n, title, desc }) => (
                <div
                  key={n}
                  className="relative flex flex-row items-start gap-4 md:flex-1 md:flex-col md:items-center md:px-4 md:text-center"
                >
                  <div className="bg-primary text-primary-foreground relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md">
                    {n}
                  </div>
                  <div className="md:mt-3">
                    <p className="font-semibold">{title}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="lp-s5 border-border w-full border-t" />

          {/* ── Features ──────────────────────────────────────────────── */}
          <section className="lp-s6 w-full py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold">Everything you need</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Designed for UP Cebu students.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="skeu-card lp-feature-card bg-card rounded-xl border p-5"
                >
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────────────── */}
          <section className="lp-s6 w-full pb-16">
            <div className="skeu-card bg-card rounded-2xl border p-8 text-center">
              <AppLogo className="mx-auto mb-4 size-14" />
              <h2 className="text-xl font-bold">
                Ready to simplify your academics?
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Join UP Cebu students who track all their tasks in one place.
              </p>
              <Button asChild size="lg" className="mt-6 gap-2">
                <Link href="/login">
                  Sign in with Google
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <footer className="lp-s6 border-border w-full border-t pb-10 pt-8 text-center">
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} TapO(1) &mdash;{" "}
              <Link
                href="/privacy"
                className="hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
