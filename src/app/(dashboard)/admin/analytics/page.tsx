import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Receipt,
  Trophy,
} from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { auth } from "@/lib/auth";
import { getAdminAnalyticsData } from "@/lib/admin-analytics";
import { formatDate, formatNaira, SCHOOL_DAY_LABELS } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const analytics = await getAdminAnalyticsData(user.schoolId);

  const statIcons = [
    <CreditCard key="collected" className="h-5 w-5" />,
    <Receipt key="outstanding" className="h-5 w-5" />,
    <Trophy key="results" className="h-5 w-5" />,
    <BarChart3 key="reports" className="h-5 w-5" />,
  ];

  return (
    <main className="space-y-6 py-2">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(15,23,42,0.72)_45%,_rgba(14,165,233,0.22))] p-6 shadow-2xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/80">
            Admin Analytics
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Watch school operations across finance, learning, and attendance.
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-200/85 md:text-base">
            This view brings together the signals that help admin teams spot collection gaps,
            attendance concerns, and academic movement quickly.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analytics.quickStats.map((stat, index) => (
            <DashboardStatCard
              key={stat.label}
              label={stat.label}
              value={
                index < 2
                  ? formatNaira(Number(stat.value))
                  : typeof stat.value === "number" && index === 2
                    ? `${Number(stat.value).toFixed(1)}%`
                    : stat.value
              }
              helper={stat.helper}
              icon={statIcons[index]}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          eyebrow="Attendance"
          title="Latest class registers"
          description="The most recent attendance capture for each class helps flag pressure points early."
        >
          {analytics.attendanceByClass.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No attendance data has been recorded yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.attendanceByClass.map((item) => (
                <article
                  key={item.classId}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.className}</p>
                      <p className="mt-1 text-sm text-stone-400">{formatDate(item.dateKey)}</p>
                    </div>
                    <div className="text-right text-sm text-stone-300">
                      <p>Present {item.present}</p>
                      <p>Absent {item.absent}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>Late {item.late}</span>
                    <span>Excused {item.excused}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Attendance pressure"
          title="Classes needing follow-up"
          description="These classes show the highest latest away rates across absence, lateness, and excused entries."
        >
          {analytics.attendancePressure.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No attendance pressure signals are available yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.attendancePressure.map((item) => (
                <article
                  key={`pressure-${item.classId}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{item.className}</p>
                      <p className="mt-1 text-sm text-stone-400">{formatDate(item.dateKey)}</p>
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {item.awayRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>Total {item.total}</span>
                    <span>Away {item.absent + item.late + item.excused}</span>
                    <span>Present {item.present}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          eyebrow="Timetable"
          title="Scheduling coverage"
          description="This view shows how widely the timetable has been populated and whether the current school day is fully mapped."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <DashboardStatCard
              label="Scheduled Classes"
              value={analytics.timetableCoverage.scheduledClasses}
              helper="Classes with at least one timetable slot configured."
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <DashboardStatCard
              label="Unscheduled Classes"
              value={analytics.timetableCoverage.unscheduledClasses}
              helper="Classes still waiting for timetable coverage."
              icon={<Receipt className="h-5 w-5" />}
            />
            <DashboardStatCard
              label="Total Periods"
              value={analytics.timetableCoverage.totalPeriods}
              helper="All timetable slots configured across the school."
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <DashboardStatCard
              label="Today&apos;s Slots"
              value={analytics.timetableCoverage.todayScheduleCount}
              helper="Periods scheduled for the current school day."
              icon={<Trophy className="h-5 w-5" />}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Today"
          title="Current day timetable highlights"
          description="A quick read on which classes already have periods assigned for the active school day."
        >
          {!analytics.currentSchoolDay ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              Today is outside the school timetable window.
            </div>
          ) : analytics.timetableHighlights.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No timetable periods are configured for {SCHOOL_DAY_LABELS[analytics.currentSchoolDay]} yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.timetableHighlights.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="font-semibold text-white">{item.className}</p>
                  <p className="mt-1 text-sm text-stone-400">{item.subjectName}</p>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          eyebrow="Academics"
          title="Class performance"
          description="A top-line read on average class performance from recorded subject results."
        >
          {analytics.classPerformance.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No result data is available yet for analytics.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.classPerformance.map((item) => (
                <article
                  key={item.classId}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{item.className}</p>
                      <p className="text-sm text-stone-400">Average recorded score</p>
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {item.averageScore.toFixed(1)}%
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          eyebrow="Finance"
          title="Recent collections"
          description="Latest recorded fee payments help the admin desk monitor collection momentum."
        >
          {analytics.recentPayments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No payment activity has been recorded yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.recentPayments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {payment.student.user.firstName} {payment.student.user.lastName}
                      </p>
                      <p className="mt-1 text-sm text-stone-400">{payment.fee.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatNaira(payment.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {payment.status}
                      </p>
                    </div>
                  </div>
                  {payment.paidAt ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                      {formatDate(payment.paidAt)}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Reporting"
          title="Recent report cards"
          description="Track report-card generation and publishing activity across the school."
        >
          {analytics.recentReportCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No report cards have been generated yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {analytics.recentReportCards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {card.student.user.firstName} {card.student.user.lastName}
                      </p>
                      <p className="mt-1 text-sm text-stone-400">
                        {card.student.class?.name ?? "No class"} • {card.term.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {card.averageScore !== null ? `${card.averageScore.toFixed(1)}%` : "-"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {card.isPublished ? "Published" : "Draft"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {formatDate(card.generatedAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>
    </main>
  );
}
