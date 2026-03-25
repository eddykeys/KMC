import Link from "next/link";
import { notFound } from "next/navigation";
import { publishExamResultsFormAction } from "@/app/(dashboard)/teacher/exams/[examId]/submissions/actions";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

function getSubmissionReviewState(
  submission: {
    submittedAt: Date | null;
    totalScore: number | null;
    answers: Array<{ marksObtained: number | null }>;
  },
) {
  const hasPendingReview = submission.answers.some((answer) => answer.marksObtained === null);
  const isSubmitted = submission.submittedAt !== null;
  const isReviewComplete = isSubmitted && !hasPendingReview && submission.totalScore !== null;

  return {
    hasPendingReview,
    isSubmitted,
    isReviewComplete,
  };
}

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

  const syncedResults = await prisma.result.findMany({
    where: {
      subjectId: exam.subjectId,
      termId: exam.termId,
      studentId: {
        in: exam.submissions.map((submission) => submission.studentId),
      },
    },
    select: {
      studentId: true,
      examScore: true,
    },
  });

  const resultByStudentId = new Map(
    syncedResults.map((result) => [result.studentId, result]),
  );

  const submissionStates = exam.submissions.map((submission) => {
    const reviewState = getSubmissionReviewState(submission);
    const syncedResult = resultByStudentId.get(submission.studentId);
    const isSyncedToResults =
      reviewState.isReviewComplete &&
      syncedResult?.examScore !== null &&
      syncedResult?.examScore === submission.totalScore;

    return {
      submission,
      ...reviewState,
      isSyncedToResults,
      isReadyToPublish: reviewState.isReviewComplete && !isSyncedToResults,
    };
  });

  const gradedCount = submissionStates.filter((entry) => entry.isReviewComplete).length;
  const pendingReviewCount = submissionStates.filter(
    (entry) => entry.isSubmitted && !entry.isReviewComplete,
  ).length;
  const syncedCount = submissionStates.filter((entry) => entry.isSyncedToResults).length;
  const readyToPublishCount = submissionStates.filter((entry) => entry.isReadyToPublish).length;

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
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Graded</p>
            <p className="mt-2 text-2xl font-semibold text-white">{gradedCount}</p>
          </div>
          <div className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Pending review</p>
            <p className="mt-2 text-2xl font-semibold text-white">{pendingReviewCount}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Synced</p>
            <p className="mt-2 text-2xl font-semibold text-white">{syncedCount}</p>
          </div>
          <div className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">Ready to publish</p>
            <p className="mt-2 text-2xl font-semibold text-white">{readyToPublishCount}</p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1 text-sm text-stone-300">
              <p className="font-medium text-white">Results sync</p>
              <p>
                Only fully graded submissions publish into term results. Existing result records are
                updated when a score changes.
              </p>
              <p className="text-stone-400">
                {readyToPublishCount > 0
                  ? `${readyToPublishCount} graded submission(s) are ready to sync right now.`
                  : gradedCount > 0
                    ? "All fully graded submissions are already synced to results."
                    : "There are no fully graded submissions available to publish yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={publishExamResultsFormAction}>
                <input type="hidden" name="examId" value={exam.id} />
                <button
                  type="submit"
                  disabled={readyToPublishCount === 0}
                  className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-stone-500 disabled:hover:bg-white/5"
                >
                  {readyToPublishCount > 0 ? "Publish graded scores to results" : "Results already up to date"}
                </button>
              </form>
              <Link
                href={`/teacher/exams/${exam.id}/analytics`}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                View analytics
              </Link>
            </div>
          </div>
        </div>

        {exam.submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No student submissions have been recorded for this exam yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {submissionStates.map(({ submission, hasPendingReview, isSyncedToResults, isReadyToPublish }) => {

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
                    {hasPendingReview ? <span>Needs review</span> : <span>Review complete</span>}
                    {isSyncedToResults ? (
                      <span className="text-emerald-300">Synced to results</span>
                    ) : isReadyToPublish ? (
                      <span className="text-sky-300">Ready to publish</span>
                    ) : null}
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
