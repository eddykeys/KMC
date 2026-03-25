import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ExamQuestionForm } from "@/components/dashboard/exam-question-form";
import { toggleExamPublishFormAction } from "@/app/(dashboard)/teacher/exams/[examId]/actions";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function TeacherExamDetailPage({
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
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      submissions: {
        select: {
          id: true,
          submittedAt: true,
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
        eyebrow="Exam Builder"
        title={exam.title}
        description={`Manage questions and publishing for ${exam.subject.name} in ${exam.class.name}.`}
      >
        <div className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{exam.type}</span>
          <span>{exam.term.name}</span>
          <span>{exam.duration} min</span>
          <span>{exam.totalMarks} marks</span>
          <span>{exam.questions.length} question(s)</span>
          <span>{formatDate(exam.createdAt)}</span>
        </div>
        <form action={toggleExamPublishFormAction}>
          <input type="hidden" name="examId" value={exam.id} />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
            >
              {exam.isPublished ? "Unpublish exam" : "Publish exam"}
            </button>
            <Link
              href={`/teacher/exams/${exam.id}/submissions`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Review submissions
            </Link>
            <Link
              href={`/teacher/exams/${exam.id}/analytics`}
              className="inline-flex items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/20"
            >
              View analytics
            </Link>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Question authoring"
        title="Add exam questions"
        description="Build the question set one item at a time and keep the exam ready for publishing."
      >
        <ExamQuestionForm examId={exam.id} />
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Assessment activity"
        title="Submission snapshot"
        description="Track whether students have submitted and jump straight into grading when review is needed."
      >
        {exam.submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No submissions have been recorded for this exam yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {exam.submissions.map((submission) => (
              <article
                key={submission.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="text-sm text-stone-300">
                  {submission.submittedAt
                    ? `Submitted ${formatDate(submission.submittedAt)}`
                    : "Submission started"}
                </div>
                <Link
                  href={`/teacher/exams/${exam.id}/submissions/${submission.id}`}
                  className="inline-flex items-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
                >
                  Open review
                </Link>
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        eyebrow="Question bank"
        title="Current questions"
        description="Review drafted questions, answer keys, and order before releasing the exam to students."
      >
        {exam.questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-stone-400">
            No questions added yet. Use the form above to begin building this exam.
          </div>
        ) : (
          <div className="grid gap-3">
            {exam.questions.map((question) => (
              <article
                key={question.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <span>Question {question.order}</span>
                  <span>{question.questionType}</span>
                  <span>{question.marks} mark(s)</span>
                </div>
                <p className="mt-3 text-white">{question.questionText}</p>
                {Array.isArray(question.options) && question.options.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option, index) => (
                      <div
                        key={`${question.id}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-stone-300"
                      >
                        {String(option)}
                      </div>
                    ))}
                  </div>
                ) : null}
                {question.correctAnswer ? (
                  <p className="mt-4 text-sm text-emerald-200">
                    Correct answer: {question.correctAnswer}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </DashboardPanel>
    </main>
  );
}
