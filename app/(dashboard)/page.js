import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/dal";
import OverviewDashboard from "@/components/OverviewDashboard";

export default async function OverviewPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    return <p style={{ color: "var(--status-delayed)" }}>과제 데이터를 불러오지 못했습니다: {error.message}</p>;
  }

  return <OverviewDashboard initialTasks={tasks || []} profile={profile} />;
}
