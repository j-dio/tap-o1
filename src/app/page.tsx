import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  ArrowRight,
  Zap,
  BookOpen,
  GraduationCap,
  BellRing,
  RefreshCw,
  CalendarClock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppLogo } from "@/components/app-logo";

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
    desc: "Grant Classroom access and keep assignment updates in one board.",
    icon: RefreshCw,
  },
];

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Drag-and-Drop Board",
    desc: "Prioritise your week with a Kanban board — move tasks between To-Do, In Progress, and Done.",
  },
  {
    icon: BellRing,
    title: "Deadline Reminders",
    desc: "Enable push notifications to get reminders for upcoming tasks due within 24 hours.",
  },
  {
    icon: PlusCircle,
    title: "Custom Tasks",
    desc: "Add tasks that aren't in any platform — study sessions, personal deadlines, anything.",
  },
  {
    icon: CalendarClock,
    title: "Fast Weekly Focus",
    desc: "See what needs action now with focused To-Do, In Progress, and Done windows.",
  },
];

const productSignals = [
  { value: "2", label: "academic sources" },
  { value: "1", label: "unified board" },
  { value: "24h", label: "due reminder window" },
];

const trustItems: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    title: "Single Sign-On",
    text: "Use your existing Google account and manage connections from settings anytime.",
  },
  {
    icon: Sparkles,
    title: "Low-Friction Setup",
    text: "From first login to synced tasks in minutes, not hours.",
  },
  {
    icon: Zap,
    title: "Built for Daily Use",
    text: "Fast interactions, practical defaults, and fewer tab switches during busy weeks.",
  },
];

const faq = [
  {
    q: "Does TapO(1) fully work offline today?",
    a: "Not yet. TapO(1) currently depends on online sync to stay accurate across Moodle and Classroom.",
  },
  {
    q: "Can I still track personal tasks?",
    a: "Yes. You can create custom tasks for study blocks, personal deadlines, or anything outside class platforms.",
  },
  {
    q: "How quickly do my tasks appear after setup?",
    a: "Most users see synced tasks within seconds after connecting UVEC and Google Classroom.",
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
        @keyframes lp-chip-enter {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lp-liquid-sheen {
          0% { transform: translateX(-130%) rotate(-10deg); }
          100% { transform: translateX(130%) rotate(-10deg); }
        }
        @keyframes lp-liquid-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -6px); }
        }
        @keyframes lp-pop-in {
          0% { opacity: 0; transform: scale(0.96) translateY(10px); }
          70% { opacity: 1; transform: scale(1.01) translateY(0); }
          100% { opacity: 1; transform: scale(1); }
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
        .lp-s7 { animation: lp-fade-up 0.6s ease-out 0.78s both; }
        .lp-feature-card {
          transition: transform 280ms ease, box-shadow 280ms ease;
          animation: lp-pop-in 0.5s ease-out both;
        }
        .lp-feature-card:hover {
          transform: translateY(-5px);
        }
        .lp-feature-card:nth-child(1) { animation-delay: 0.08s; }
        .lp-feature-card:nth-child(2) { animation-delay: 0.16s; }
        .lp-feature-card:nth-child(3) { animation-delay: 0.24s; }
        .lp-feature-card:nth-child(4) { animation-delay: 0.32s; }
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
        .lp-hero-chip {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border: 1px solid oklch(1 0 0 / 28%);
          box-shadow:
            inset 0 1px 0 oklch(1 0 0 / 28%),
            inset 0 -8px 20px oklch(0.18 0.02 265 / 18%),
            0 16px 32px oklch(0.178 0.022 265 / 18%);
          -webkit-backdrop-filter: blur(12px) saturate(135%);
          backdrop-filter: blur(12px) saturate(135%);
          animation: lp-chip-enter 0.55s ease-out both;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .lp-hero-chip:nth-child(2) { animation-delay: 0.08s; }
        .lp-hero-chip:nth-child(3) { animation-delay: 0.16s; }
        .lp-hero-chip:hover {
          transform: translateY(-2px);
          box-shadow:
            inset 0 1px 0 oklch(1 0 0 / 32%),
            inset 0 -10px 22px oklch(0.18 0.02 265 / 20%),
            0 20px 38px oklch(0.178 0.022 265 / 24%);
        }
        .lp-signal {
          background-image:
            linear-gradient(
              145deg,
              oklch(0.97 0.008 260 / 52%),
              oklch(0.95 0.022 265 / 30%) 45%,
              oklch(0.985 0.004 255 / 54%)
            );
        }
        .dark .lp-signal {
          background-image:
            linear-gradient(
              145deg,
              oklch(0.33 0.028 275 / 56%),
              oklch(0.28 0.02 265 / 38%) 45%,
              oklch(0.35 0.02 250 / 58%)
            );
        }
        .lp-signal::before {
          content: "";
          position: absolute;
          inset: -30% -20%;
          z-index: -1;
          background: linear-gradient(
            90deg,
            transparent 25%,
            oklch(1 0 0 / 34%) 50%,
            transparent 75%
          );
          animation: lp-liquid-sheen 8.5s linear infinite;
          pointer-events: none;
        }
        .lp-signal::after {
          content: "";
          position: absolute;
          right: -16px;
          bottom: -20px;
          width: 88px;
          height: 88px;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            oklch(1 0 0 / 22%) 0%,
            transparent 70%
          );
          animation: lp-liquid-drift 5.8s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-logo, .lp-logo > img { animation: none; }
          .lp-s1, .lp-s2, .lp-s3, .lp-s4, .lp-s5, .lp-s6, .lp-s7, .lp-badge,
          .lp-hero-chip, .lp-feature-card, .lp-signal {
            animation: none; opacity: 1;
          }
          .lp-signal::before, .lp-signal::after {
            animation: none;
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

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6">
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
            <p className="lp-s3 text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
              TapO(1) pulls your tasks from UVEC and Google Classroom into a
              single drag-and-drop board, so you can spend less time tracking
              systems and more time finishing requirements.
            </p>

            {/* CTA buttons */}
            <div className="lp-s4 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/login">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a href="#how-it-works">
                  See setup flow
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            {/* Complexity pill */}
            <div className="lp-badge bg-muted border-border text-muted-foreground rounded-full border px-4 py-1.5 font-mono text-xs">
              <Zap className="mr-1.5 mb-px inline size-3 text-yellow-500" />
              O(1) access · no context-switching · always in sync
            </div>

            <div className="lp-s5 grid w-full max-w-3xl gap-3 pt-2 sm:grid-cols-3">
              {productSignals.map(({ value, label }) => (
                <div
                  key={label}
                  className="lp-hero-chip lp-signal border-border/60 rounded-xl border px-4 py-3"
                >
                  <p className="text-foreground text-lg font-bold">{value}</p>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="lp-s4 border-border w-full border-t" />

          {/* ── How it works ──────────────────────────────────────────── */}
          <section id="how-it-works" className="lp-s5 w-full py-16">
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

              {steps.map(({ n, title, desc, icon: Icon }) => (
                <div
                  key={n}
                  className="relative flex flex-row items-start gap-4 md:flex-1 md:flex-col md:items-center md:px-4 md:text-center"
                >
                  <div className="bg-primary text-primary-foreground relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md">
                    {n}
                  </div>
                  <div className="md:mt-3">
                    <p className="flex items-center gap-2 font-semibold md:justify-center">
                      <Icon className="text-primary size-4" />
                      {title}
                    </p>
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
          <section id="what-you-get" className="lp-s6 w-full py-16">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold">Everything you need</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Designed for UP Cebu students.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* ── Value / Trust ─────────────────────────────────────────── */}
          <section className="lp-s7 w-full py-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="bg-card/70 rounded-xl border p-5 backdrop-blur-sm"
                >
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <section className="lp-s7 w-full py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold">Frequently asked</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Clear expectations before you sign in.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-4">
              {faq.map((item) => (
                <div key={item.q} className="bg-card/80 rounded-xl border p-5">
                  <p className="font-semibold">{item.q}</p>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────────────── */}
          <section className="lp-s7 w-full pb-16">
            <div className="skeu-card bg-card rounded-2xl border p-8 text-center">
              <AppLogo className="mx-auto mb-4 size-14" />
              <h2 className="text-xl font-bold">
                Ready to simplify your academics?
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Join UP Cebu students tracking Moodle and Classroom tasks in one
                place.
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
          <footer className="lp-s7 border-border w-full border-t pt-8 pb-10 text-center">
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} TapO(1) &mdash; Dio{" "}
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
