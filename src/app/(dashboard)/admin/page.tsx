import {
  Bell,
  BookOpenText,
  GraduationCap,
  LayoutGrid,
  Users,
} from "lucide-react";
import { AnnouncementList } from "@/components/dashboard/announcement-list";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { RosterList } from "@/components/dashboard/roster-list";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import type { SessionUser } from "@/types";

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getAdminDashboardData(user.schoolId);

  const statIcons = [
    <Users key="teachers" className="h-5 w-5" />,
    <GraduationCap key="students" className="h-5 w-5" />,
    <LayoutGrid key="classes" className="h-5 w-5" />,
    <BookOpenText key="exams" className="h-5 w-5" />,
  ];

  return (
    <main className="space-y-6 py-2">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(15,23,42,0.7)_45%,_rgba(15,118,110,0.28))] p-6 shadow-2xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/80">
            Administrative Overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Keep the school moving with one clear operating view.
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-200/85 md:text-base">
            This dashboard brings enrollment, staffing, class ownership, and school-wide
            communication into one place so the admin desk can spot gaps early.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.quickStats.map((stat, index) => (
            <DashboardStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              helper={stat.helper}
              icon={statIcons[index]}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          eyebrow="Latest registrations"
          title="Newest accounts"
          description="Freshly created users appear here so the admin team can verify provisioning and reach out if details are incomplete."
        >
          {dashboard.stats.recentRegistrations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No users have been registered for this school yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.stats.recentRegistrations.map((registration) => (
                <article
                  key={registration.id}
                  className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{registration.name}</p>
                    <p className="text-sm text-stone-400">{registration.role}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm text-stone-300">{registration.accessId}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {formatDate(registration.createdAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Broadcast center"
          title="Announcement pressure"
          description="A quick read on communication volume so important notices do not get buried."
        >
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3 text-amber-100">
                <Bell className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                  Active notices
                </p>
              </div>
              <p className="mt-4 text-4xl font-semibold text-white">
                {dashboard.totalAnnouncements}
              </p>
              <p className="mt-2 text-sm text-stone-400">
                Total currently active announcements for this school.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-stone-300">
                Highest priority communication should stay short, visible, and refreshed when the
                school calendar changes.
              </p>
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardPanel
          eyebrow="Faculty"
          title="Teacher spotlight"
          description="A compact faculty list with subject coverage and class ownership."
        >
          <RosterList
            items={dashboard.teacherRoster}
            emptyTitle="No teachers onboarded"
            emptyDescription="Create teacher accounts to begin assigning classes and subjects."
          />
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Enrollment"
          title="Student spotlight"
          description="Quick visibility into recent student records and where follow-up may be needed."
        >
          <RosterList
            items={dashboard.studentRoster}
            emptyTitle="No students enrolled"
            emptyDescription="Student records will appear here once admission entries start coming in."
          />
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          eyebrow="Class structure"
          title="Class ownership"
          description="Each class should have a clear lead and a visible student count."
        >
          {dashboard.stats.classTeacherSummary.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              Classes have not been configured for this school yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.stats.classTeacherSummary.map((item) => (
                <article
                  key={item.classId}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{item.className}</p>
                      <p className="text-sm text-stone-400">
                        {item.teacherName || "No class teacher assigned yet"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-white">{item.totalStudents}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                        students
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Communication"
          title="Latest announcements"
          description="Recent school messages with priority labels to help admins decide what needs a refresh."
        >
          <AnnouncementList items={dashboard.announcementItems} />
        </DashboardPanel>
      </section>
    </main>
  );
}
