import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/dal";
import TaskBoard from "@/components/TaskBoard";

export default async function TasksPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: tasks } = await supabase.from("tasks").select("*").order("priority", { ascending: false });

  return (
    <Suspense>
      <TaskBoard initialTasks={tasks || []} profile={profile} />
    </Suspense>
  );
}
