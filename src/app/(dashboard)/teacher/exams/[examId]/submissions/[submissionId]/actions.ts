"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActionSuccess } from "@/lib/action-telemetry";
import type { SessionUser } from "@/types";

export interface SubmissionGradingFormState {
  success: boolean;
  message: string;
}

export async function gradeSubmissionFormAction(
  examId: string,
  submissionId: string,
  _prevState: SubmissionGradingFormState,
  formData: FormData
): Promise<SubmissionGradingFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

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
        include: {
          questions: true,
        },
      },
      answers: true,
    },
  });

  if (!submission) {
    return {
      success: false,
      message: "Submission not found.",
    };
  }

  let totalScore = 0;

  for (const answer of submission.answers) {
    const question = submission.exam.questions.find((item) => item.id === answer.questionId);
    if (!question) {
      continue;
    }

    const rawMarks = formData.get(`marks_${answer.id}`);
    const parsedMarks =
      typeof rawMarks === "string" && rawMarks.trim().length > 0 ? Number(rawMarks) : 0;
    const marksObtained = Math.min(question.marks, Math.max(0, parsedMarks));

    totalScore += marksObtained;

    const isObjective =
      question.questionType === "MCQ" ||
      question.questionType === "TRUE_FALSE" ||
      question.questionType === "FILL_IN_THE_BLANK";

    await prisma.examAnswer.update({
      where: { id: answer.id },
      data: {
        marksObtained,
        isCorrect:
          isObjective && marksObtained === question.marks
            ? true
            : isObjective && marksObtained === 0
              ? false
              : null,
      },
    });
  }

  const percentage =
    submission.exam.totalMarks > 0 ? (totalScore / submission.exam.totalMarks) * 100 : 0;

  await prisma.examSubmission.update({
    where: { id: submissionId },
    data: {
      totalScore,
      percentage,
      submittedAt: submission.submittedAt ?? new Date(),
    },
  });

  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath(`/teacher/exams/${examId}/submissions`);
  revalidatePath(`/teacher/exams/${examId}/submissions/${submissionId}`);
  revalidatePath("/student");
  revalidatePath("/student/results");

  logActionSuccess({
    action: "teacher.exam.submission.grade",
    actorRole: user.role,
    actorId: user.id,
    schoolId: user.schoolId,
    targetId: submissionId,
    details: {
      examId,
      totalScore,
      percentage,
    },
  });

  return {
    success: true,
    message: "Submission graded successfully.",
  };
}
