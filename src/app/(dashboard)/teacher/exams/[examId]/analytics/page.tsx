import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

function getReviewState(
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

export default async function TeacherExamAnalyticsPage({
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
      term: { select: { name: true } },
      questions: {
        select: {
          id: true,
        },
      },
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
            select: {
              id: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const results = await prisma.result.findMany({
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
      totalScore: true,
      grade: true,
    },
  });

  const resultByStudentId = new Map(results.map((result) => [result.studentId, result]));
  const passMark = exam.passingMarks ?? 50;

  const submissionStates = exam.submissions.map((submission) => {
    const reviewState = getReviewState(submission);
    const syncedResult = resultByStudentId.get(submission.studentId);
    const isSyncedToResults =
      reviewState.isReviewComplete &&
      syncedResult?.examScore !== null &&
      syncedResult?.examScore === submission.totalScore;

    return {
      ...reviewState,
      submission,
      isSyncedToResults,
    };
  });

  const completedSubmissions = submissionStates.filter((entry) => entry.isSubmitted);
  const gradedSubmissions = submissionStates.filter((entry) => entry.isReviewComplete);
  const pendingReviewSubmissions = submissionStates.filter(
    (entry) => entry.isSubmitted && !entry.isReviewComplete,
  );
  const syncedSubmissions = submissionStates.filter((entry) => entry.isSyncedToResults);
  const flaggedSubmissions = submissionStates.filter(
    (entry) => entry.submission.violationLogs.length > 0,
  );

  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce(
          (total, entry) => total + (entry.submission.totalScore ?? 0),
          0,
        ) / gradedSubmissions.length
      : 0;

  const passCount = gradedSubmissions.filter(
    (entry) => (entry.submission.totalScore ?? 0) >= passMark,
  ).length;
  const scoreBands = {
    excellent: gradedSubmissions.filter((entry) => (entry.submission.percentage ?? 0) >= 70).length,
    fair: gradedSubmissions.filter((entry) => {
      const percentage = entry.submission.percentage ?? 0;
      return percentage >= 50 && percentage < 70;
    }).length,
    needsSupport: gradedSubmissions.filter((entry) => (entry.submission.percentage ?? 0) < 50).length,
    pending: pendingReviewSubmissions.length,
  };

  const violationBreakdown = Array.from(
    submissionStates
      .flatMap((entry) => entry.submission.violationLogs)
      .reduce((map, violation) => {
        map.set(violation.type, (map.get(violation.type) ?? 0) + 1);
        return map;
      }, new Map<string, number>())
      .entries(),
  ).sort((a, b) => b[1] - a[1]);

  const topPerformers = [...gradedSubmissions]
    .sort((a, b) => (b.submission.totalScore ?? 0) - (a.submission.totalScore ?? 0))
    .slice(0, 5);

  const followUpQueue = submissionStates
    .filter((entry) => {
      const score = entry.submission.percentage ?? 0;
      return entry.hasPendingReview || entry.submission.violationLogs.length >= 2 || score < 50;
    })
    .slice(0, 6);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Exam analytics"
        title={`${exam.title} insights`}
        description={`Track scoring trends, review backlog, and result-sync coverage for ${exam.subject.name} in ${exam.class.name}.`}
      >
        <div className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{exam.type}</span>
          <span>{exam.term.name}</span>
          <span>{exam.totalMarks} marks</span>
          <span>{exam.questions.length} question(s)</span>
          <span>Pass mark {passMark}</span>
          <span>{formatDate(exam.createdAt)}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/teacher/exams/${exam.id}`}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Back to exam builder
          </Link>
          <Link
            href={`/teacher/exams/${exam.id}/submissions`}
            className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
          >
            Open submissions
          </Link>
        </div>
      </DashboardPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Submitted</p>
          <p className="mt-2 text-3xl font-semibold text-white">{completedSubmissions.length}</p>
          <p className="mt-2 text-sm text-stone-400">
            {exam.submissions.length} started attempt(s) across the class.
          </p>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Average score</p>
          <p className="mt-2 text-3xl font-semibold text-white">{averageScore.toFixed(1)}</p>
          <p className="mt-2 text-sm text-stone-400">
            Based on {gradedSubmissions.length} fully graded submission(s).
          </p>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Pass rate</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {gradedSubmissions.length > 0 ? `${((passCount / gradedSubmissions.length) * 100).toFixed(1)}%` : "0.0%"}
          </p>
          <p className="mt-2 text-sm text-stone-400">
            {passCount} learner(s) met the current pass mark.
          </p>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Result sync</p>
          <p className="mt-2 text-3xl font-semibold text-white">{syncedSubmissions.length}</p>
          <p className="mt-2 text-sm text-stone-400">
            {gradedSubmissions.length - syncedSubmissions.length} graded submission(s) still need publishing.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <DashboardPanel
          eyebrow="Performance bands"
          title="Score distribution"
          description="Quick view of who is excelling, passing safely, or still needs support before the term closes."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">70% and above</p>
              <p className="mt-2 text-2xl font-semibold text-white">{scoreBands.excellent}</p>
            </div>
            <div className="rounded-3xl border border-sky-300/15 bg-sky-300/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">50% to 69%</p>
              <p className="mt-2 text-2xl font-semibold text-white">{scoreBands.fair}</p>
            </div>
            <div className="rounded-3xl border border-rose-300/15 bg-rose-300/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Below 50%</p>
              <p className="mt-2 text-2xl font-semibold text-white">{scoreBands.needsSupport}</p>
            </div>
            <div className="rounded-3xl border border-amber-300/15 bg-amber-300/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Pending review</p>
              <p className="mt-2 text-2xl font-semibold text-white">{scoreBands.pending}</p>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Proctoring watch"
          title="Integrity signals"
          description="Violation summaries help you spot submissions that may need closer review before results are finalized."
        >
          <div className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Flagged submissions</p>
              <p className="mt-2 text-2xl font-semibold text-white">{flaggedSubmissions.length}</p>
            </div>
            {violationBreakdown.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-stone-400">
                No proctoring violations have been recorded for this exam.
              </div>
            ) : (
              <div className="grid gap-2">
                {violationBreakdown.slice(0, 5).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-300"
                  >
                    <span>{type.replaceAll("_", " ")}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          eyebrow="Top performers"
          title="Highest scoring submissions"
          description="Use this shortlist for recognition, moderation, or quick quality checks on standout responses."
        >
          {topPerformers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No fully graded submissions are available yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {topPerformers.map((entry) => {
                const result = resultByStudentId.get(entry.submission.studentId);

                return (
                  <article
                    key={entry.submission.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {entry.submission.student.user.firstName} {entry.submission.student.user.lastName}
                        </p>
                        <p className="mt-1 text-sm text-stone-400">
                          {entry.submission.student.user.accessId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {entry.submission.totalScore ?? 0}/{exam.totalMarks}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                          {entry.submission.percentage?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                      {result?.grade ? <span>Grade {result.grade}</span> : null}
                      {entry.isSyncedToResults ? <span className="text-emerald-300">Synced</span> : <span className="text-sky-300">Awaiting publish</span>}
                      {entry.submission.violationLogs.length > 0 ? <span>{entry.submission.violationLogs.length} violation(s)</span> : <span>Clean proctoring</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          eyebrow="Follow-up queue"
          title="Needs attention"
          description="This queue surfaces submissions that still need grading, have repeated violations, or show weak performance."
        >
          {followUpQueue.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
              No immediate follow-up items were detected for this exam.
            </div>
          ) : (
            <div className="grid gap-3">
              {followUpQueue.map((entry) => (
                <article
                  key={entry.submission.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {entry.submission.student.user.firstName} {entry.submission.student.user.lastName}
                      </p>
                      <p className="mt-1 text-sm text-stone-400">
                        {entry.submission.student.user.accessId}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/exams/${exam.id}/submissions/${entry.submission.id}`}
                      className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
                    >
                      Open review
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                    {entry.hasPendingReview ? <span className="text-amber-300">Pending review</span> : null}
                    {(entry.submission.percentage ?? 0) < 50 && entry.isReviewComplete ? (
                      <span className="text-rose-300">Below pass range</span>
                    ) : null}
                    {entry.submission.violationLogs.length >= 2 ? (
                      <span className="text-amber-300">{entry.submission.violationLogs.length} violations</span>
                    ) : null}
                    {!entry.isSyncedToResults && entry.isReviewComplete ? (
                      <span className="text-sky-300">Not yet published</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </DashboardPanel>
      </section>
    </main>
  );
}
