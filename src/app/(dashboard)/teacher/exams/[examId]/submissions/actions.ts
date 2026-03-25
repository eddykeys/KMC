"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateGrade } from "@/lib/utils";
import type { SessionUser } from "@/types";

export async function publishExamResultsFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    throw new Error("Unauthorized request.");
  }

  const examId = formData.get("examId");

  if (typeof examId !== "string" || examId.length === 0) {
    throw new Error("Missing exam id.");
  }

  const exam = await prisma.exam.findFirst({
    where: {
      id: examId,
      teacherId: user.teacherId,
    },
    include: {
      submissions: {
        where: {
          submittedAt: {
            not: null,
          },
        },
        include: {
          answers: {
            select: {
              marksObtained: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found.");
  }

  for (const submission of exam.submissions) {
    const hasPendingReview = submission.answers.some((answer) => answer.marksObtained === null);
    if (hasPendingReview || submission.totalScore === null) {
      continue;
    }

    const examScore = submission.totalScore ?? 0;
    const existingResult = await prisma.result.findUnique({
      where: {
        studentId_subjectId_termId: {
          studentId: submission.studentId,
          subjectId: exam.subjectId,
          termId: exam.termId,
        },
      },
      select: {
        firstCA: true,
        secondCA: true,
        midTermTest: true,
        assignment: true,
        project: true,
        teacherComment: true,
      },
    });

    const totalScore = Math.min(
      100,
      (existingResult?.firstCA ?? 0) +
        (existingResult?.secondCA ?? 0) +
        (existingResult?.midTermTest ?? 0) +
        (existingResult?.assignment ?? 0) +
        (existingResult?.project ?? 0) +
        examScore
    );
    const grade = calculateGrade(totalScore);

    await prisma.result.upsert({
      where: {
        studentId_subjectId_termId: {
          studentId: submission.studentId,
          subjectId: exam.subjectId,
          termId: exam.termId,
        },
      },
      update: {
        examScore,
        totalScore,
        grade: grade.grade,
        remark: grade.remark,
      },
      create: {
        studentId: submission.studentId,
        subjectId: exam.subjectId,
        termId: exam.termId,
        examScore,
        totalScore,
        grade: grade.grade,
        remark: grade.remark,
        teacherComment: existingResult?.teacherComment ?? null,
      },
    });
  }

  revalidatePath("/teacher/results");
  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath(`/teacher/exams/${examId}/submissions`);
  revalidatePath("/student");
  revalidatePath("/student/results");
  revalidatePath("/student/report-cards");
}
