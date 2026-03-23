import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { WeeklyReportForm } from "@/components/dashboard/weekly-report-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherWeeklyReportsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const [terms, reports] = await Promise.all([
    prisma.term.findMany({
      where: {
        session: {
          schoolId: user.schoolId,
        },
      },
      orderBy: [{ session: { startDate: "desc" } }, { startDate: "asc" }],
      select: {
        id: true,
        name: true,
        session: {
          select: { name: true },
        },
      },
    }),
    prisma.weeklyReport.findMany({
      where: {
        teacherId: user.teacherId,
      },
      orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        term: {
          include: {
            session: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Weekly reporting"
        title="Submit teaching reports"
        description="Capture weekly teaching progress, challenges, and next-step plans for accountability and school visibility."
      >
        <WeeklyReportForm
          terms={terms.map((term) => ({
            id: term.id,
            name: term.name,
            sessionName: term.session.name,
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Recent reports"
        title="Latest submissions"
        description="Your most recent weekly reports appear here so you can track instructional continuity over time."
      >
        {reports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No weekly reports have been submitted yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {formatDate(report.weekStart)} to {formatDate(report.weekEnd)}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      {report.term.name} • {report.term.session.name}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                    Submitted {formatDate(report.createdAt)}
                  </p>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Summary</p>
                    <p className="mt-2 text-sm text-stone-300">{report.summary}</p>
                  </div>

                  {report.challenges ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Challenges</p>
                      <p className="mt-2 text-sm text-stone-300">{report.challenges}</p>
                    </div>
                  ) : null}

                  {report.plans ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Next week plans</p>
                      <p className="mt-2 text-sm text-stone-300">{report.plans}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
