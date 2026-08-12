import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canCreateTask, isAdminLevel } from "@/lib/permissions";

// Centralized session + profile lookup for Server Components / Server Actions.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, department, role")
    .eq("id", user.id)
    .single();

  return profile;
});

// "Can participate as an editor" (create tasks, appear in the board's edit
// affordances) — per-task edit rights are further narrowed by canEditTask().
export function canEdit(profile) {
  return canCreateTask(profile?.role);
}

export function isAdmin(profile) {
  return isAdminLevel(profile?.role);
}
