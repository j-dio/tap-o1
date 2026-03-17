"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uvecIcalUrlSchema } from "@/lib/validations/auth";

/**
 * Signs the user out and redirects to the login page.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Saves the UVEC iCal URL to the user's profile during onboarding.
 */
export async function saveUvecIcalUrl(uvecIcalUrl: string) {
  // Server-side validation (client-side can be bypassed)
  const validated = uvecIcalUrlSchema.safeParse(uvecIcalUrl);
  if (!validated.success) {
    return { error: "Invalid UVEC iCal URL" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ uvec_ical_url: validated.data })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
