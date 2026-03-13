import Link from "next/link";
import { BookOpen, Bell, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: BookOpen,
    title: "Unified View",
    desc: "See tasks from UVEC and Google Classroom together",
  },
  {
    icon: Bell,
    title: "Never Miss Due Dates",
    desc: "Smart reminders before deadlines",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    desc: "Install as an app on any device",
  },
];

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="bg-primary flex size-20 items-center justify-center rounded-2xl">
          <span className="text-primary-foreground text-2xl font-bold">
            O(1)
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">TapO(1)</h1>
          <p className="text-muted-foreground text-lg">
            Academic tracking in constant time. All your university tasks from
            UVEC and Google Classroom in one place.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
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
