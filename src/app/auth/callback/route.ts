import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { session } = data;

  // Persist Google refresh token so sync works across sessions
  if (session?.provider_refresh_token && session.user) {
    await supabase
      .from("profiles")
      .update({ google_refresh_token: session.provider_refresh_token })
      .eq("id", session.user.id);
  }

  // Check if user has completed onboarding (has UVEC URL set)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("uvec_ical_url")
      .eq("id", user.id)
      .single();

    // If no profile, create one then go to onboarding
    if (!profile) {
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name:
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        email: user.email,
        google_refresh_token: session?.provider_refresh_token ?? null,
      });
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // If profile exists and has UVEC URL, go to requested destination
    if (profile.uvec_ical_url) {
      // If `next` was explicitly set (e.g. from settings reconnect), honor it
      return NextResponse.redirect(
        `${origin}${next === "/onboarding" ? "/dashboard" : next}`,
      );
    }
  }

  // Otherwise, go to onboarding
  return NextResponse.redirect(`${origin}${next}`);
}
