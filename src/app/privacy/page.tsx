import type { Metadata } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";

export const metadata: Metadata = {
  title: "Privacy Policy — TapO(1)",
  description: "Privacy Policy for TapO(1) Academic Task Aggregator",
};

const SUPPORT_EMAIL = "tapo1support@gmail.com";
const EFFECTIVE_DATE = "March 19, 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <Link href="/">
            <AppLogo className="size-14" />
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert text-foreground max-w-none space-y-8">
          {/* Introduction */}
          <section className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              TapO(1) (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;)
              is an academic task aggregator built for UP Cebu students. This
              Privacy Policy explains what data we collect, how we use it, and
              how we protect it when you use TapO(1).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using TapO(1), you agree to the collection and use of
              information as described in this policy.
            </p>
          </section>

          {/* 1. Data We Access */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Data We Access</h2>
            <p className="text-muted-foreground">
              TapO(1) requests access to the following Google account data via
              Google OAuth:
            </p>
            <ul className="text-muted-foreground list-disc space-y-2 pl-6">
              <li>
                <strong className="text-foreground">
                  Basic profile (name, email, profile picture)
                </strong>{" "}
                — used to identify your account and display your name in the
                app.
              </li>
              <li>
                <strong className="text-foreground">
                  Google Classroom courses
                </strong>{" "}
                (<code>classroom.courses.readonly</code>) — used to list your
                enrolled classes and group tasks by course.
              </li>
              <li>
                <strong className="text-foreground">
                  Google Classroom coursework
                </strong>{" "}
                (<code>classroom.coursework.me.readonly</code>) — used to read
                your assignments and due dates to build your task timeline.
              </li>
              <li>
                <strong className="text-foreground">Student submissions</strong>{" "}
                (<code>classroom.student-submissions.me.readonly</code>) — used
                to read the submission state of your own assignments (e.g.,
                turned in, returned) so task status stays accurate.
              </li>
            </ul>
            <p className="text-muted-foreground">
              We also accept a UVEC Moodle iCal URL that you paste manually.
              This URL is stored in your profile to enable automatic task
              syncing from UVEC.
            </p>
          </section>

          {/* 2. How We Use Your Data */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
            <ul className="text-muted-foreground list-disc space-y-2 pl-6">
              <li>
                To sync and display your academic tasks from Google Classroom
                and UVEC in a unified board.
              </li>
              <li>
                To show your submission status (e.g., turned in, missing) for
                each assignment.
              </li>
              <li>
                To allow you to set custom task statuses, priorities, and notes
                that persist across sessions.
              </li>
              <li>
                To send optional push notifications about upcoming deadlines
                (only if you opt in).
              </li>
            </ul>
            <p className="text-muted-foreground">
              We do not sell, share, or use your data for advertising or any
              purpose beyond operating TapO(1).
            </p>
          </section>

          {/* 3. Data Storage */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in a Supabase-hosted PostgreSQL database with
              row-level security (RLS) enforced — only you can read or modify
              your own records. We store:
            </p>
            <ul className="text-muted-foreground list-disc space-y-2 pl-6">
              <li>
                Your Google account ID, email, and display name (from OAuth)
              </li>
              <li>
                A Google OAuth refresh token, encrypted at rest, used to sync
                Classroom data without requiring you to log in again
              </li>
              <li>
                Your UVEC iCal URL (if provided), stored to enable periodic
                syncing
              </li>
              <li>
                Task metadata (titles, due dates, source IDs) imported from
                your connected platforms
              </li>
              <li>
                Your personal task overrides: custom status, priority, and notes
              </li>
              <li>
                Push subscription tokens (only if you enable notifications)
              </li>
            </ul>
          </section>

          {/* 4. Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is retained for as long as your account is active. You
              can revoke TapO(1)&apos;s access to your Google account at any
              time from your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Account permissions page
              </a>
              . To request deletion of all your stored data, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* 5. Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
            <p className="text-muted-foreground">
              TapO(1) uses the following third-party services:
            </p>
            <ul className="text-muted-foreground list-disc space-y-2 pl-6">
              <li>
                <strong className="text-foreground">Google OAuth 2.0</strong> —
                for authentication and Classroom API access
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> — for
                database and authentication session management
              </li>
              <li>
                <strong className="text-foreground">Sentry</strong> — for
                anonymous error monitoring (no personal data sent)
              </li>
            </ul>
            <p className="text-muted-foreground">
              Each service operates under its own privacy policy. We do not
              control their practices.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal
              data at any time. You may also revoke Google access permissions
              without deleting your account. To exercise any of these rights,
              contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* 7. Changes */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy as the app evolves. Material
              changes will be communicated by updating the effective date above.
              Continued use of TapO(1) after changes constitutes acceptance of
              the updated policy.
            </p>
          </section>

          {/* 8. Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-muted-foreground">
              Questions or concerns? Reach us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
          >
            ← Back to TapO(1)
          </Link>
        </div>
      </div>
    </div>
  );
}
