import { createClient } from "@/lib/supabase/server";
import ReportView from "@/components/ReportView";

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    return <p style={{ color: "var(--status-delayed)" }}>과제 데이터를 불러오지 못했습니다: {error.message}</p>;
  }

  return <ReportView tasks={tasks || []} />;
}
