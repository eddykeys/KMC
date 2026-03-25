import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export default async function StudentTimetablePage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const student = await prisma.student.findUnique({
    where: {
      id: user.studentId,
    },
    select: {
      class: {
        select: {
          id: true,
          name: true,
          level: true,
          schedules: {
            orderBy: [{ day: "asc" }, { startTime: "asc" }],
            include: {
              subject: {
                select: {
                  name: true,
                  teachers: {
                    select: {
                      teacher: {
                        select: {
                          user: {
                            select: {
                              firstName: true,
                              lastName: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const classRecord = student?.class;

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Timetable"
        title="Your class schedule"
        description="Keep a simple weekly view of when each subject happens so you can prepare for the day ahead."
      >
        {!classRecord ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            Your student profile does not have a class assignment yet.
          </div>
        ) : classRecord.schedules.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No timetable entries have been published for {classRecord.name} yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-lg font-semibold text-white">{classRecord.name}</p>
              <p className="mt-1 text-sm text-stone-400">{classRecord.level} weekly schedule</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-5">
              {DAY_ORDER.map((day) => {
                const dayEntries = classRecord.schedules.filter((schedule) => schedule.day === day);

                return (
                  <div key={day} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                      {DAY_LABELS[day]}
                    </p>
                    <div className="mt-3 grid gap-3">
                      {dayEntries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-stone-500">
                          No class period
                        </div>
                      ) : (
                        dayEntries.map((entry) => (
                          <article
                            key={entry.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 p-3"
                          >
                            <p className="font-medium text-white">{entry.subject.name}</p>
                            <p className="mt-1 text-xs text-stone-400">
                              {entry.subject.teachers.length > 0
                                ? entry.subject.teachers
                                    .map(
                                      (teacher) =>
                                        `${teacher.teacher.user.firstName} ${teacher.teacher.user.lastName}`,
                                    )
                                    .join(", ")
                                : "Teacher assignment pending"}
                            </p>
                            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                              {entry.startTime} - {entry.endTime}
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
