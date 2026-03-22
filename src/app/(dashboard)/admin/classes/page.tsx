import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import type { SessionUser } from "@/types";

export default async function AdminClassesPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getAdminDashboardData(user.schoolId);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Classes"
        title="Class structure"
        description="This route tracks classroom ownership and helps admins spot classes that still need teachers."
      >
        {dashboard.stats.classTeacherSummary.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No classes have been configured yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {dashboard.stats.classTeacherSummary.map((item) => (
              <article
                key={item.classId}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{item.className}</p>
                    <p className="text-sm text-stone-400">
                      {item.teacherName || "No class teacher assigned yet"}
                    </p>
                  </div>
                  <div className="text-sm text-stone-300">{item.totalStudents} students</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
