import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { SubmissionGradingForm } from "@/components/dashboard/submission-grading-form";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherSubmissionDetailPage({
  params,
}: {
  params: Promise<{ examId: string; submissionId: string }>;
}) {
  const { examId, submissionId } = await params;
  const session = await auth();
  const user = session?.user as SessionUser;

  const submission = await prisma.examSubmission.findFirst({
    where: {
      id: submissionId,
      examId,
      exam: {
        teacherId: user.teacherId,
      },
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          totalMarks: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
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
        orderBy: {
          question: {
            order: "asc",
          },
        },
        include: {
          question: true,
        },
      },
      violationLogs: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Submission review"
        title={`${submission.student.user.firstName} ${submission.student.user.lastName}`}
        description={`Grade and review this ${submission.exam.subject.name} submission for ${submission.exam.class.name}.`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-stone-400">Student</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {submission.student.user.accessId}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-stone-400">Score</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {submission.totalScore ?? 0}/{submission.exam.totalMarks}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-stone-400">Percentage</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {submission.percentage !== null ? `${submission.percentage.toFixed(1)}%` : "Pending"}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-stone-400">Violations</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {submission.violationLogs.length}
            </p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{submission.exam.title}</span>
          <span>{submission.submittedAt ? `Submitted ${formatDate(submission.submittedAt)}` : "In progress"}</span>
          {submission.isAutoSubmitted ? <span>Auto submitted</span> : null}
        </div>
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Answer script"
        title="Review and grade answers"
        description="Objective answers can be adjusted and written responses can be scored question by question."
      >
        <SubmissionGradingForm
          examId={submission.exam.id}
          submissionId={submission.id}
          answers={submission.answers.map((answer) => ({
            id: answer.id,
            answer: answer.answer,
            marksObtained: answer.marksObtained,
            isCorrect: answer.isCorrect,
            question: {
              id: answer.question.id,
              questionText: answer.question.questionText,
              questionType: answer.question.questionType,
              marks: answer.question.marks,
              correctAnswer: answer.question.correctAnswer,
              options: answer.question.options,
            },
          }))}
        />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Integrity log"
        title="Proctoring events"
        description="Violation history is shown here to help teachers review suspicious attempts before finalizing scores."
      >
        {submission.violationLogs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No proctoring violations were recorded for this submission.
          </div>
        ) : (
          <div className="grid gap-3">
            {submission.violationLogs.map((violation) => (
              <article
                key={violation.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="font-semibold text-white">{violation.type}</p>
                <p className="mt-1 text-sm text-stone-400">
                  {violation.description || "No additional description recorded."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>{formatDate(violation.timestamp)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
