import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { RosterList } from "@/components/dashboard/roster-list";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import type { SessionUser } from "@/types";

export default async function AdminStudentsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getAdminDashboardData(user.schoolId);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Students"
        title="Enrollment directory"
        description="A focused student view for recent enrollment records and follow-up on incomplete profiles."
      >
        <RosterList
          items={dashboard.studentRoster}
          emptyTitle="No students enrolled"
          emptyDescription="Student records will populate here once the admission flow is used."
        />
      </DashboardPanel>
    </main>
  );
}
