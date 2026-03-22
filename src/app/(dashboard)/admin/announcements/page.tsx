import { AnnouncementList } from "@/components/dashboard/announcement-list";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import type { SessionUser } from "@/types";

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getAdminDashboardData(user.schoolId);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Announcements"
        title="School message board"
        description="A dedicated view of current announcements with room for creation and publishing tools in the next pass."
      >
        <AnnouncementList items={dashboard.announcementItems} />
      </DashboardPanel>
    </main>
  );
}
