import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { auth } from "@/lib/auth";
import { getTeacherDashboardData } from "@/lib/teacher-dashboard";
import { formatDate, SCHOOL_DAY_LABELS } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherDashboardPage() {
  const session = await auth();
  const user = session?.user as SessionUser;
  const dashboard = await getTeacherDashboardData(user.teacherId!);

  const classTeacherOf = dashboard.teacher?.classTeacherOf;
  const subjectAssignments = dashboard.teacher?.subjects ?? [];

  return (
    <main className="space-y-6 py-2">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,_rgba(56,189,248,0.22),_rgba(15,23,42,0.7)_45%,_rgba(16,185,129,0.22))] p-6 shadow-2xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-100/80">
            Teaching Overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Stay on top of classes, plans, and upcoming assessments.
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-200/85 md:text-base">
            This workspace gives each teacher a clear view of active class ownership, assigned
            subjects, lesson preparation, and exam activity.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="Assigned Subjects"
            value={dashboard.stats.subjectCount}
            helper="Subjects currently mapped to your teaching load."
            icon={<BookOpen className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Lesson Plans"
            value={dashboard.stats.lessonPlanCount}
            helper="Lesson plans created and ready for classroom delivery."
            icon={<FileText className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Exams"
            value={dashboard.stats.examCount}
            helper="Assessments created under your teaching account."
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <DashboardStatCard
            label="Weekly Reports"
            value={dashboard.stats.weeklyReportCount}
            helper="Teaching reports submitted across recent work cycles."
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          eyebrow="Class ownership"
          title="Your classroom footprint"
          description="Quick visibility into the class you own directly and the subjects you are expected to cover."
        >
          <div className="grid gap-4">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-medium text-stone-300">Class teacher assignment</p>
              {classTeacherOf ? (
                <>
                  <p className="mt-2 text-2xl font-semibold text-white">{classTeacherOf.name}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {classTeacherOf.level} with {classTeacherOf._count.students} enrolled students
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-stone-400">
                  You are not currently set as a class teacher.
                </p>
              )}
            </article>

            <div className="grid gap-3">
              {subjectAssignments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
                  No subjects have been assigned to you yet.
                </div>
              ) : (
                subjectAssignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="font-semibold text-white">{assignment.subject.name}</p>
                    <p className="mt-1 text-sm text-stone-400">
                      {assignment.subject.class.name} ({assignment.subject.class.level})
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                      {assignment.subject.code ? <span>{assignment.subject.code}</span> : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Upcoming work"
          title="Assessment queue"
          description="Stay ahead of upcoming exams linked to your subjects and classes."
        >
          {dashboard.upcomingExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No upcoming exams are scheduled under your account yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.upcomingExams.map((exam) => (
                <article
                  key={exam.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="font-semibold text-white">{exam.title}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {exam.subject.name} for {exam.class.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{exam.type}</span>
                    <span>{exam.startTime ? formatDate(exam.startTime) : "Date pending"}</span>
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
          title="Today&apos;s teaching slots"
          description="Your active timetable for the current school day helps you move from preparation into delivery without leaving the dashboard."
        >
          {!dashboard.currentSchoolDay ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              Today is outside the school timetable window.
            </div>
          ) : dashboard.todaySchedule.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No timetable slots are assigned to you for {SCHOOL_DAY_LABELS[dashboard.currentSchoolDay]}.
            </div>
          ) : (
            <div className="grid gap-3">
              {dashboard.todaySchedule.map((slot) => (
                <article
                  key={slot.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{slot.subject.name}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {slot.class.name} ({slot.class.level})
                      </p>
                    </div>
                    <div className="rounded-2xl bg-sky-300/10 px-3 py-2 text-sm font-medium text-sky-100">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Attendance"
          title="Latest register snapshot"
          description="A quick attendance summary helps teachers spot the latest attendance pressure without opening the full register."
        >
          {!dashboard.attendanceSnapshot ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No attendance record has been captured under this teacher account yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Latest capture</p>
                    <p className="mt-1 text-sm text-stone-400">
                      {formatDate(dashboard.attendanceSnapshot.date)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100">
                    {dashboard.attendanceSnapshot.classNames.join(", ")}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <DashboardStatCard
                  label="Present"
                  value={dashboard.attendanceSnapshot.present}
                  helper="Students marked present in the latest attendance capture."
                  icon={<Users className="h-5 w-5" />}
                />
                <DashboardStatCard
                  label="Away / Late"
                  value={
                    dashboard.attendanceSnapshot.absent +
                    dashboard.attendanceSnapshot.late +
                    dashboard.attendanceSnapshot.excused
                  }
                  helper="Students absent, late, or excused in the latest capture."
                  icon={<CalendarDays className="h-5 w-5" />}
                />
              </div>
            </div>
          )}
        </DashboardPanel>
      </section>

      <DashboardPanel
        eyebrow="Planning"
        title="Recent lesson plans"
        description="Recent planning work appears here so teachers can keep track of prepared content and what still needs to be drafted."
      >
        {dashboard.recentLessonPlans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No lesson plans have been created yet for this teacher account.
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
                  <span>{plan.term.name}</span>
                  <span>{formatDate(plan.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
