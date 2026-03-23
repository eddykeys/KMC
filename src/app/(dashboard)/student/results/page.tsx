import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentResultsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const results = await prisma.result.findMany({
    where: {
      studentId: user.studentId,
    },
    orderBy: [{ term: { session: { startDate: "desc" } } }, { updatedAt: "desc" }],
    select: {
      id: true,
      firstCA: true,
      secondCA: true,
      midTermTest: true,
      assignment: true,
      project: true,
      examScore: true,
      totalScore: true,
      grade: true,
      remark: true,
      teacherComment: true,
      updatedAt: true,
      subject: {
        select: {
          name: true,
          class: {
            select: {
              name: true,
            },
          },
        },
      },
      term: {
        select: {
          name: true,
          session: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Results"
        title="Your academic performance"
        description="Review recorded CA, test, project, and exam scores across terms for the subjects on your class profile."
      >
        {results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No published result records are available on your profile yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((result) => (
              <article
                key={result.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{result.subject.name}</p>
                    <p className="mt-1 text-sm text-stone-400">
                      {result.subject.class.name} • {result.term.name} • {result.term.session.name}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-100">
                    {result.totalScore ?? 0}% • {result.grade ?? "Pending"}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    First CA: {result.firstCA ?? "-"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    Second CA: {result.secondCA ?? "-"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    Midterm: {result.midTermTest ?? "-"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    Assignment: {result.assignment ?? "-"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    Project: {result.project ?? "-"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                    Exam: {result.examScore ?? "-"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  {result.remark ? <span>{result.remark}</span> : null}
                  <span>Updated {formatDate(result.updatedAt)}</span>
                </div>

                {result.teacherComment ? (
                  <p className="mt-4 text-sm text-stone-300">{result.teacherComment}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
