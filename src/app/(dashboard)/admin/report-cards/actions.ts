"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export interface ReportCardFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"studentId" | "termId", string[]>>;
}

export async function generateReportCardFormAction(
  _prevState: ReportCardFormState,
  formData: FormData
): Promise<ReportCardFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized request." };
  }

  const studentId = formData.get("studentId");
  const termId = formData.get("termId");
  const principalComment = formData.get("principalComment");
  const classTeacherComment = formData.get("classTeacherComment");
  const isPublished = formData.get("isPublished") === "on";

  if (typeof studentId !== "string" || studentId.length === 0) {
    return {
      success: false,
      message: "Student is required.",
      errors: { studentId: ["Student is required."] },
    };
  }

  if (typeof termId !== "string" || termId.length === 0) {
    return {
      success: false,
      message: "Term is required.",
      errors: { termId: ["Term is required."] },
    };
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      user: {
        schoolId: user.schoolId,
      },
    },
    select: {
      id: true,
      classId: true,
    },
  });

  if (!student) {
    return { success: false, message: "Student not found." };
  }

  const results = await prisma.result.findMany({
    where: {
      studentId,
      termId,
    },
    select: {
      totalScore: true,
    },
  });

  if (results.length === 0) {
    return {
      success: false,
      message: "This student has no result records for the selected term yet.",
    };
  }

  const totalScore = results.reduce((sum, result) => sum + (result.totalScore ?? 0), 0);
  const averageScore = totalScore / results.length;

  let position: number | null = null;
  let outOf: number | null = null;

  if (student.classId) {
    const classmates = await prisma.student.findMany({
      where: { classId: student.classId },
      select: {
        id: true,
        results: {
          where: { termId },
          select: { totalScore: true },
        },
      },
    });

    const ranked = classmates
      .map((classmate) => {
        const classmateScores = classmate.results.filter(
          (result) => typeof result.totalScore === "number"
        );
        if (classmateScores.length === 0) {
          return null;
        }

        const average =
          classmateScores.reduce((sum, result) => sum + (result.totalScore ?? 0), 0) /
          classmateScores.length;

        return {
          studentId: classmate.id,
          average,
        };
      })
      .filter((item): item is { studentId: string; average: number } => item !== null)
      .sort((a, b) => b.average - a.average);

    outOf = ranked.length;
    position = ranked.findIndex((item) => item.studentId === studentId) + 1 || null;
  }

  await prisma.reportCard.upsert({
    where: {
      studentId_termId: {
        studentId,
        termId,
      },
    },
    update: {
      totalScore,
      averageScore,
      position,
      outOf,
      principalComment:
        typeof principalComment === "string" && principalComment.length > 0
          ? principalComment
          : null,
      classTeacherComment:
        typeof classTeacherComment === "string" && classTeacherComment.length > 0
          ? classTeacherComment
          : null,
      isPublished,
      generatedAt: new Date(),
    },
    create: {
      studentId,
      termId,
      totalScore,
      averageScore,
      position,
      outOf,
      principalComment:
        typeof principalComment === "string" && principalComment.length > 0
          ? principalComment
          : null,
      classTeacherComment:
        typeof classTeacherComment === "string" && classTeacherComment.length > 0
          ? classTeacherComment
          : null,
      isPublished,
    },
  });

  revalidatePath("/admin/report-cards");
  revalidatePath("/student/report-cards");

  return {
    success: true,
    message: "Report card generated successfully.",
  };
}

export async function toggleReportCardPublishFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const reportCardId = formData.get("reportCardId");

  if (typeof reportCardId !== "string" || reportCardId.length === 0) {
    throw new Error("Missing report card id.");
  }

  const reportCard = await prisma.reportCard.findFirst({
    where: {
      id: reportCardId,
      student: {
        user: {
          schoolId: user.schoolId,
        },
      },
    },
    select: {
      id: true,
      isPublished: true,
    },
  });

  if (!reportCard) {
    throw new Error("Report card not found.");
  }

  await prisma.reportCard.update({
    where: { id: reportCardId },
    data: {
      isPublished: !reportCard.isPublished,
    },
  });

  revalidatePath("/admin/report-cards");
  revalidatePath(`/admin/report-cards/${reportCardId}`);
  revalidatePath("/admin/analytics");
  revalidatePath("/student/report-cards");
}

export async function deleteReportCardFormAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized request.");
  }

  const reportCardId = formData.get("reportCardId");

  if (typeof reportCardId !== "string" || reportCardId.length === 0) {
    throw new Error("Missing report card id.");
  }

  await prisma.reportCard.delete({
    where: { id: reportCardId },
  });

  revalidatePath("/admin/report-cards");
  revalidatePath("/admin/analytics");
  revalidatePath("/student/report-cards");
}
