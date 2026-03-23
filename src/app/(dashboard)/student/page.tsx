import { Bell, BookOpen, ClipboardCheck, Trophy } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { auth } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/student-dashboard";
import { formatDate, truncate } from "@/lib/utils";
import type { SessionUser } from "@/types";

const PRIORITY_LABELS: Record<number, string> = {
  0: "Normal",
  1: "Important",
  2: "Urgent",
};

export default async function StudentDashboardPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getStudentDashboardData(user.studentId!);

  if (!dashboard) {
    return (
      <main className="py-2">
        <DashboardPanel
          eyebrow="Student"
          title="Profile not ready"
          description="Your student record has not been fully linked yet. Please contact the school administrator."
        >
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No student profile data is currently available for this account.
          </div>
        </DashboardPanel>
      </main>
    );
  }

  return (
    <main className="space-y-6 py-2">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,_rgba(16,185,129,0.22),_rgba(15,23,42,0.7)_45%,_rgba(59,130,246,0.18))] p-6 shadow-2xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100/80">
            Student Overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Track exams, class updates, and learning materials in one place.
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-200/85 md:text-base">
            This dashboard keeps students focused on what matters next: assessments, notices,
            and recent learning materials for their class.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="Class"
            value={dashboard.student.class?.name ?? "Pending"}
            helper="Current class placement on your student profile."
            icon={<BookOpen className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Published Exams"
            value={dashboard.publishedExams.length}
            helper="Exams currently visible to your class."
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Recent Results"
            value={dashboard.recentResults.length}
            helper="Latest scored assessments recorded on your profile."
            icon={<Trophy className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Active Notices"
            value={dashboard.announcements.length}
            helper="Recent announcements for your school or class."
            icon={<Bell className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          eyebrow="Assessments"
          title="Available exams"
          description="Published exams for your class appear here with timing information so you can prepare ahead."
        >
          {dashboard.publishedExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No published exams are available for your class yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.publishedExams.map((exam) => (
                <article
                  key={exam.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-lg font-semibold text-white">{exam.title}</p>
                  <p className="mt-1 text-sm text-stone-400">{exam.subject.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{exam.type}</span>
                    <span>{exam.duration} min</span>
                    <span>{exam.startTime ? formatDate(exam.startTime) : "Date pending"}</span>
                    {exam.endTime ? <span>Ends {formatDate(exam.endTime)}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Results"
          title="Recent performance"
          description="Latest recorded results help students keep an eye on progress subject by subject."
        >
          {dashboard.recentResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No recent results have been published for you yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.recentResults.map((result) => (
                <article
                  key={result.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="font-semibold text-white">{result.subject.name}</p>
                  <p className="mt-1 text-sm text-stone-400">{result.term.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {result.totalScore !== null ? <span>{result.totalScore}%</span> : null}
                    {result.grade ? <span>Grade {result.grade}</span> : null}
                    {result.remark ? <span>{result.remark}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          eyebrow="Announcements"
          title="School and class notices"
          description="Important notices from your school or class teacher show up here."
        >
          {dashboard.announcements.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No active announcements at the moment.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      {PRIORITY_LABELS[announcement.priority] ?? "Normal"}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {announcement.class?.name || "School-wide"}
                    </span>
                  </div>
                  <p className="font-semibold text-white">{announcement.title}</p>
                  <p className="mt-2 text-sm text-stone-400">
                    {truncate(announcement.content, 200)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Learning materials"
          title="Recent lesson plans"
          description="Recently added lesson plans for your class help students revisit current topics and classroom coverage."
        >
          {dashboard.recentLessonPlans.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No recent lesson materials are available for your class yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.recentLessonPlans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="font-semibold text-white">{plan.title}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {plan.subject.name} • {plan.topic}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{formatDate(plan.createdAt)}</span>
                    <span>{plan.isAIGenerated ? "AI enhanced" : "Teacher drafted"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>
    </main>
  );
}
