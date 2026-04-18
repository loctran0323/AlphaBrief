"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const current = formData.get("current") as string | null;
  const password = formData.get("password") as string | null;
  const confirm = formData.get("confirm") as string | null;

  if (!current) return redirect("/dashboard/account?error=Current+password+is+required");
  if (!password || password.length < 8)
    return redirect("/dashboard/account?error=New+password+must+be+at+least+8+characters");
  if (password !== confirm)
    return redirect("/dashboard/account?error=New+passwords+do+not+match");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return redirect("/dashboard/account?error=Not+signed+in");

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (signInError) return redirect("/dashboard/account?error=Current+password+is+incorrect");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return redirect(`/dashboard/account?error=${encodeURIComponent(error.message)}`);
  return redirect("/dashboard/account?passwordChanged=1");
}
