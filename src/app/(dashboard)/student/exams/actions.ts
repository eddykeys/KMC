"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActionFailure, logActionSuccess } from "@/lib/action-telemetry";
import type { SessionUser } from "@/types";

export async function ensureExamSubmission(examId: string) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user || user.role !== "STUDENT" || !user.studentId) {
      throw new Error("Unauthorized request.");
    }

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
      select: { id: true },
    });

    if (!exam) {
      throw new Error("Exam not available for this student.");
    }

    const submission = await prisma.examSubmission.upsert({
      where: {
        examId_studentId: {
          examId,
          studentId: user.studentId,
        },
      },
      update: {},
      create: {
        examId,
        studentId: user.studentId,
      },
      include: {
        answers: true,
      },
    });

    logActionSuccess({
      action: "student.exam.submission.ensure",
      actorRole: user.role,
      actorId: user.id,
      schoolId: user.schoolId,
      targetId: submission.id,
      details: {
        examId,
      },
    });

    return submission;
  } catch (error) {
    logActionFailure(
      {
        action: "student.exam.submission.ensure",
        targetId: examId,
      },
      error
    );
    throw error;
  }
}

export async function submitStudentExamFormAction(
  examId: string,
  submissionId: string,
  formData: FormData
) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user || user.role !== "STUDENT" || !user.studentId) {
      throw new Error("Unauthorized request.");
    }

    const submission = await prisma.examSubmission.findFirst({
      where: {
        id: submissionId,
        examId,
        studentId: user.studentId,
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found.");
    }

    let totalScore = 0;

    for (const question of submission.exam.questions) {
      const rawAnswer = formData.get(`answer_${question.id}`);
      const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : "";

      const normalizedAnswer = answer.toLowerCase();
      const normalizedCorrectAnswer = (question.correctAnswer || "").trim().toLowerCase();
      const isObjective =
        question.questionType === "MCQ" ||
        question.questionType === "TRUE_FALSE" ||
        question.questionType === "FILL_IN_THE_BLANK";
      const isCorrect =
        isObjective && normalizedCorrectAnswer.length > 0
          ? normalizedAnswer === normalizedCorrectAnswer
          : null;
      const marksObtained = isCorrect ? question.marks : isObjective ? 0 : null;

      if (typeof marksObtained === "number") {
        totalScore += marksObtained;
      }

      await prisma.examAnswer.upsert({
        where: {
          submissionId_questionId: {
            submissionId,
            questionId: question.id,
          },
        },
        update: {
          answer,
          isCorrect,
          marksObtained,
        },
        create: {
          submissionId,
          questionId: question.id,
          answer,
          isCorrect,
          marksObtained,
        },
      });
    }

    const percentage =
      submission.exam.totalMarks > 0 ? (totalScore / submission.exam.totalMarks) * 100 : 0;

    await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        submittedAt: new Date(),
        totalScore,
        percentage,
      },
    });

    revalidatePath("/student");
    revalidatePath("/student/exams");
    revalidatePath(`/student/exams/${examId}`);

    logActionSuccess({
      action: "student.exam.submit",
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
  } catch (error) {
    logActionFailure(
      {
        action: "student.exam.submit",
        targetId: submissionId,
        details: {
          examId,
        },
      },
      error
    );
    throw error;
  }
}
