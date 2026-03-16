import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, WifiOff, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const GITHUB_README_URL =
  "https://github.com/[GITHUB_OWNER]/[GITHUB_REPO]#readme";

const steps = [
  {
    n: 1,
    title: "Sign in with Google",
    desc: "Use your UP Cebu Google account — no separate password.",
  },
  {
    n: 2,
    title: "Connect UVEC Moodle",
    desc: "Paste your UVEC iCal URL once; tasks sync automatically.",
  },
  {
    n: 3,
    title: "Sync Google Classroom",
    desc: "Grant Classroom access — assignments import in seconds.",
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
    <div className="bg-background flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="bg-primary flex size-20 items-center justify-center rounded-2xl">
          <span className="text-primary-foreground text-2xl font-bold">
            O(1)
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">TapO(1)</h1>
          <p className="text-lg font-semibold">
            One place for every UP Cebu task
          </p>
          <p className="text-muted-foreground">
            TapO(1) pulls your pending tasks from UVEC Moodle and Google
            Classroom into a single drag-and-drop board — no more switching
            between platforms.
          </p>
        </div>

        <section className="w-full text-left">
          <h2 className="mb-4 text-lg font-semibold">How it works</h2>
          <ol className="flex flex-col gap-4">
            {steps.map(({ n, title, desc }) => (
              <li key={n} className="flex flex-row items-start gap-3">
                <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Sign in with Google</Link>
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

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card rounded-lg border p-4 text-left"
            >
              <Icon className="text-primary size-5" />
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-1 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
