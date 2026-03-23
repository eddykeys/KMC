import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherExamSubmissionsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      teacherId: user.teacherId,
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      submissions: {
        orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  accessId: true,
                },
              },
            },
          },
          answers: {
            select: {
              marksObtained: true,
            },
          },
          violationLogs: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Exam review"
        title={`${exam.title} submissions`}
        description={`Review student attempts for ${exam.subject.name} in ${exam.class.name}.`}
      >
        <div className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{exam.submissions.length} submission(s)</span>
          <span>{exam.totalMarks} marks</span>
          <span>{exam.type}</span>
        </div>

        {exam.submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No student submissions have been recorded for this exam yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {exam.submissions.map((submission) => {
              const pendingManualReview = submission.answers.some(
                (answer) => answer.marksObtained === null
              );

              return (
                <article
                  key={submission.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {submission.student.user.firstName} {submission.student.user.lastName}
                      </p>
                      <p className="mt-1 text-sm text-stone-400">
                        {submission.student.user.accessId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {submission.totalScore ?? 0}/{exam.totalMarks}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                        {submission.percentage !== null ? `${submission.percentage.toFixed(1)}%` : "Ungraded"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{submission.submittedAt ? `Submitted ${formatDate(submission.submittedAt)}` : "In progress"}</span>
                    <span>{submission.violationLogs.length} violation(s)</span>
                    {submission.isAutoSubmitted ? <span>Auto submitted</span> : null}
                    {pendingManualReview ? <span>Needs review</span> : <span>Review complete</span>}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/teacher/exams/${exam.id}/submissions/${submission.id}`}
                      className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
                    >
                      Review submission
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
