import AppShell from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/dal";

export default async function DashboardLayout({ children }) {
  const profile = await getCurrentProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
