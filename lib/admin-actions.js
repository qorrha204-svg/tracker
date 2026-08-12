"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminLevel } from "@/lib/permissions";

// Removes a user's account entirely (auth.users row). profiles cascades on
// delete; tasks/task_updates they authored are kept but created_by/author_id
// is set to null (see migration 004).
export async function removeUser(targetUserId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
  if (!isAdminLevel(profile?.role)) {
    return { error: "관리자/CEO만 계정을 추방할 수 있습니다." };
  }

  if (targetUserId === user.id) {
    return { error: "본인 계정은 추방할 수 없습니다." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
