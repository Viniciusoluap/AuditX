"use server";

import { redirect } from "next/navigation";
import { authConfigured, createClient } from "@/lib/supabase/server";

export async function logout() {
  if (authConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
