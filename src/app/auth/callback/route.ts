import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // We must set auth cookies on the SAME response object we return.
  // Using `createClient()` (which goes through `cookies()` from next/headers)
  // writes cookies to an implicit response, but `NextResponse.redirect()`
  // creates a *different* response — so the cookies are lost and the user
  // ends up in an infinite login loop.
  //
  // Instead, create a single redirect response upfront and attach cookies to it.
  const redirectResponse = NextResponse.redirect(`${origin}/onboarding`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { session } = data;

  // Persist Google refresh token so sync works across sessions.
  // Without this, subsequent syncs cannot refresh an expired access token.
  if (session?.provider_refresh_token && session.user) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ google_refresh_token: session.provider_refresh_token })
      .eq("id", session.user.id);

    if (updateError) {
      console.error(
        "Failed to persist Google refresh token:",
        updateError.message,
      );
      // Redirect to settings with an error flag so the user knows reconnect
      // didn't fully succeed and they should try again.
      const dest = next === "/onboarding" ? next : `${next}?google_reconnect=failed`;
      redirectResponse.headers.set("Location", `${origin}${dest}`);
      return redirectResponse;
    }
  } else if (session?.user && !session.provider_refresh_token) {
    // Google didn't return a refresh token — the stored one (if any) may be
    // stale.  This can happen when Supabase doesn't propagate provider tokens
    // or when Google omits the refresh token despite prompt=consent.
    console.warn(
      "OAuth callback completed but provider_refresh_token is null — Google refresh token was NOT updated.",
    );
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
      // redirectResponse already points to /onboarding — return as-is
      return redirectResponse;
    }

    // If profile exists and has UVEC URL, go to requested destination
    if (profile.uvec_ical_url) {
      const destination =
        next === "/onboarding" ? "/dashboard" : next;
      redirectResponse.headers.set(
        "Location",
        `${origin}${destination}`,
      );
      return redirectResponse;
    }
  }

  // Otherwise, go to onboarding (already the default redirect target)
  redirectResponse.headers.set("Location", `${origin}${next}`);
  return redirectResponse;
}
