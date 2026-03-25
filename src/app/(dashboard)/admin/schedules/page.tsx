import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ScheduleCopyForm } from "@/components/dashboard/schedule-copy-form";
import { ScheduleCreateForm } from "@/components/dashboard/schedule-create-form";
import { deleteScheduleFormAction } from "@/app/(dashboard)/admin/schedules/actions";
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

export default async function AdminSchedulesPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [subjects, classes, schedules] = await Promise.all([
    prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        class: {
          select: {
            name: true,
          },
        },
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
    }),
    prisma.class.findMany({
      where: {
        schoolId: user.schoolId,
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
      },
    }),
    prisma.schedule.findMany({
      where: {
        class: {
          schoolId: user.schoolId,
        },
      },
      orderBy: [{ class: { name: "asc" } }, { day: "asc" }, { startTime: "asc" }],
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
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
    }),
  ]);

  const groupedSchedules = schedules.reduce<
    Array<{
      classId: string;
      className: string;
      level: string;
      entries: typeof schedules;
    }>
  >((groups, schedule) => {
    const existing = groups.find((group) => group.classId === schedule.class.id);
    if (existing) {
      existing.entries.push(schedule);
      return groups;
    }

    groups.push({
      classId: schedule.class.id,
      className: schedule.class.name,
      level: schedule.class.level,
      entries: [schedule],
    });

    return groups;
  }, []);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Timetable"
        title="Build the school schedule"
        description="Create weekly timetable entries for each class while preventing overlapping periods for classes and assigned teachers."
      >
        <ScheduleCreateForm
          subjects={subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
            className: subject.class.name,
            teacherLabel: subject.teachers
              .map((entry) => `${entry.teacher.user.firstName} ${entry.teacher.user.lastName}`)
              .join(", "),
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Bulk scheduling"
        title="Copy one class day into another"
        description="Speed up repeated weekly patterns by copying a class timetable from one weekday into an empty target day."
      >
        <ScheduleCopyForm classes={classes} />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Weekly board"
        title="Current timetable entries"
        description="Review the weekly structure by class, jump into editing, and remove incorrect periods when schedules change."
      >
        {groupedSchedules.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No timetable entries have been created yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {groupedSchedules.map((group) => (
              <article
                key={group.classId}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-4">
                  <p className="text-lg font-semibold text-white">{group.className}</p>
                  <p className="mt-1 text-sm text-stone-400">{group.level} timetable view</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-5">
                  {DAY_ORDER.map((day) => {
                    const dayEntries = group.entries.filter((entry) => entry.day === day);

                    return (
                      <div key={`${group.classId}-${day}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                          {DAY_LABELS[day]}
                        </p>
                        <div className="mt-3 grid gap-3">
                          {dayEntries.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-stone-500">
                              No period
                            </div>
                          ) : (
                            dayEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                              >
                                <p className="font-medium text-white">{entry.subject.name}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                                <p className="mt-2 text-xs text-stone-400">
                                  {entry.subject.teachers.length > 0
                                    ? entry.subject.teachers
                                        .map(
                                          (teacher) =>
                                            `${teacher.teacher.user.firstName} ${teacher.teacher.user.lastName}`,
                                        )
                                        .join(", ")
                                    : "Teacher assignment pending"}
                                </p>
                                <form action={deleteScheduleFormAction} className="mt-3">
                                  <input type="hidden" name="scheduleId" value={entry.id} />
                                  <div className="flex flex-wrap gap-3">
                                    <Link
                                      href={`/admin/schedules/${entry.id}`}
                                      className="text-xs font-medium text-amber-100 transition hover:text-white"
                                    >
                                      Edit slot
                                    </Link>
                                    <button
                                      type="submit"
                                      className="text-xs font-medium text-rose-200 transition hover:text-rose-100"
                                    >
                                      Remove slot
                                    </button>
                                  </div>
                                </form>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
