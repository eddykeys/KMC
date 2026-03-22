import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { RosterList } from "@/components/dashboard/roster-list";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import type { SessionUser } from "@/types";

export default async function AdminTeachersPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getAdminDashboardData(user.schoolId);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Teachers"
        title="Faculty directory"
        description="This first admin route gives you a clean teacher roster while fuller CRUD flows are still being built."
      >
        <RosterList
          items={dashboard.teacherRoster}
          emptyTitle="No teachers onboarded"
          emptyDescription="Create teacher accounts to populate the faculty directory."
        />
      </DashboardPanel>
    </main>
  );
}
