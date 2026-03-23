import { notFound } from "next/navigation";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { StudentExamRunner } from "@/components/dashboard/student-exam-runner";
import { auth } from "@/lib/auth";
import { ensureExamSubmission, submitStudentExamFormAction } from "@/app/(dashboard)/student/exams/actions";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function StudentExamDetailPage({
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
      isPublished: true,
      class: {
        students: {
          some: {
            id: user.studentId,
          },
        },
      },
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      questions: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const submission = await ensureExamSubmission(exam.id);
  const submitAction = submitStudentExamFormAction.bind(null, exam.id, submission.id);

  return (
    <main className="space-y-6 py-2">
      <DashboardPanel
        eyebrow="Exam session"
        title={exam.title}
        description={`Assessment for ${exam.subject.name} in ${exam.class.name}.`}
      >
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>{exam.type}</span>
          <span>{exam.duration} min</span>
          <span>{exam.totalMarks} marks</span>
          <span>{exam.questions.length} question(s)</span>
          <span>{exam.startTime ? formatDate(exam.startTime) : "Date pending"}</span>
          <span>{submission.submittedAt ? "Submitted" : "In progress"}</span>
        </div>
      </DashboardPanel>

      {submission.submittedAt ? (
        <DashboardPanel
          eyebrow="Submitted"
          title="Exam already submitted"
          description="Your submission has been recorded. If scoring has been completed, the summary below reflects the current result."
        >
          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-stone-300">
              <p>Total Score: {submission.totalScore ?? "Pending"}</p>
              <p className="mt-2">Percentage: {submission.percentage ?? "Pending"}</p>
              <p className="mt-2">Submitted: {formatDate(submission.submittedAt)}</p>
            </div>
          </div>
        </DashboardPanel>
      ) : (
        <DashboardPanel
          eyebrow="Answer sheet"
          title="Complete your exam"
          description="Answer each question and submit when you are done. Proctoring controls apply automatically when enabled for this exam."
        >
          <StudentExamRunner
            examId={exam.id}
            submissionId={submission.id}
            studentId={user.studentId!}
            questions={exam.questions}
            submitAction={submitAction}
            proctoringConfig={{
              isEnabled: exam.isProctoringEnabled,
              isWebcamRequired: exam.isWebcamRequired,
              maxViolations: exam.maxViolations,
            }}
          />
        </DashboardPanel>
      )}
    </main>
  );
}
