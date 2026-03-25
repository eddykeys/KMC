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

export default async function TeacherTimetablePage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const schedules = await prisma.schedule.findMany({
    where: {
      subject: {
        teachers: {
          some: {
            teacherId: user.teacherId,
          },
        },
      },
    },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
    include: {
      class: {
        select: {
          name: true,
          level: true,
        },
      },
      subject: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Timetable"
        title="Your teaching week"
        description="Use this view to see where each subject falls across the week and spot clashes in your teaching load quickly."
      >
        {schedules.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No timetable entries are assigned to your subjects yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            {DAY_ORDER.map((day) => {
              const dayEntries = schedules.filter((schedule) => schedule.day === day);

              return (
                <div key={day} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">
                    {DAY_LABELS[day]}
                  </p>
                  <div className="mt-3 grid gap-3">
                    {dayEntries.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-stone-500">
                        Free day
                      </div>
                    ) : (
                      dayEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-3"
                        >
                          <p className="font-medium text-white">{entry.subject.name}</p>
                          <p className="mt-1 text-sm text-stone-400">
                            {entry.class.name} ({entry.class.level})
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                            <span>
                              {entry.startTime} - {entry.endTime}
                            </span>
                            {entry.subject.code ? <span>{entry.subject.code}</span> : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
