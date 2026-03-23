import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentExamsPage() {
  const session = await auth();
  const user = session?.user as SessionUser;

  const exams = await prisma.exam.findMany({
    where: {
      isPublished: true,
      class: {
        students: {
          some: {
            id: user.studentId,
          },
        },
      },
    },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      submissions: {
        where: { studentId: user.studentId },
        select: {
          id: true,
          submittedAt: true,
          totalScore: true,
          percentage: true,
        },
      },
    },
  });

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Assessments"
        title="Your exams"
        description="Open published exams for your class, continue where allowed, and review submitted assessments."
      >
        {exams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No published exams are available for your class yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {exams.map((exam) => {
              const submission = exam.submissions[0];

              return (
                <article
                  key={exam.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-lg font-semibold text-white">{exam.title}</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {exam.subject.name} • {exam.class.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{exam.type}</span>
                    <span>{exam.duration} min</span>
                    <span>{exam.totalMarks} marks</span>
                    <span>{exam.startTime ? formatDate(exam.startTime) : "Date pending"}</span>
                    <span>{submission?.submittedAt ? "Submitted" : "Not submitted"}</span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/student/exams/${exam.id}`}
                      className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
                    >
                      {submission?.submittedAt ? "View submission" : "Open exam"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
