"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateResultSchema } from "@/lib/validators";
import { calculateGrade } from "@/lib/utils";
import type { SessionUser } from "@/types";

export interface TeacherResultFormState {
  success: boolean;
  message: string;
  errors?: Partial<Record<"studentId" | "subjectId" | "termId", string[]>>;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return Number(value);
}

export async function upsertTeacherResultFormAction(
  _prevState: TeacherResultFormState,
  formData: FormData
): Promise<TeacherResultFormState> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "TEACHER" || !user.teacherId) {
    return {
      success: false,
      message: "Unauthorized request.",
    };
  }

  const parsed = updateResultSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    termId: formData.get("termId"),
    firstCA: parseOptionalNumber(formData.get("firstCA")),
    secondCA: parseOptionalNumber(formData.get("secondCA")),
    midTermTest: parseOptionalNumber(formData.get("midTermTest")),
    assignment: parseOptionalNumber(formData.get("assignment")),
    project: parseOptionalNumber(formData.get("project")),
    examScore: parseOptionalNumber(formData.get("examScore")),
    teacherComment: formData.get("teacherComment") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const [subjectAssignment, student] = await Promise.all([
    prisma.subjectTeacher.findFirst({
      where: {
        teacherId: user.teacherId,
        subjectId: parsed.data.subjectId,
      },
      select: {
        subject: {
          select: {
            classId: true,
          },
        },
      },
    }),
    prisma.student.findUnique({
      where: { id: parsed.data.studentId },
      select: {
        id: true,
        classId: true,
      },
    }),
  ]);

  if (!subjectAssignment) {
    return {
      success: false,
      message: "This subject is not assigned to your teaching load.",
    };
  }

  if (!student || !student.classId || student.classId !== subjectAssignment.subject.classId) {
    return {
      success: false,
      message: "Selected student does not belong to the class tied to this subject.",
    };
  }

  const scoreParts: Array<number | undefined> = [
    parsed.data.firstCA,
    parsed.data.secondCA,
    parsed.data.midTermTest,
    parsed.data.assignment,
    parsed.data.project,
    parsed.data.examScore,
  ];
  const totalScore = Math.min(
    100,
    scoreParts.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  );
  const gradeDetails = calculateGrade(totalScore);

  try {
    await prisma.result.upsert({
      where: {
        studentId_subjectId_termId: {
          studentId: parsed.data.studentId,
          subjectId: parsed.data.subjectId,
          termId: parsed.data.termId,
        },
      },
      update: {
        firstCA: parsed.data.firstCA ?? null,
        secondCA: parsed.data.secondCA ?? null,
        midTermTest: parsed.data.midTermTest ?? null,
        assignment: parsed.data.assignment ?? null,
        project: parsed.data.project ?? null,
        examScore: parsed.data.examScore ?? null,
        totalScore,
        grade: gradeDetails.grade,
        remark: gradeDetails.remark,
        teacherComment: parsed.data.teacherComment || null,
      },
      create: {
        studentId: parsed.data.studentId,
        subjectId: parsed.data.subjectId,
        termId: parsed.data.termId,
        firstCA: parsed.data.firstCA ?? null,
        secondCA: parsed.data.secondCA ?? null,
        midTermTest: parsed.data.midTermTest ?? null,
        assignment: parsed.data.assignment ?? null,
        project: parsed.data.project ?? null,
        examScore: parsed.data.examScore ?? null,
        totalScore,
        grade: gradeDetails.grade,
        remark: gradeDetails.remark,
        teacherComment: parsed.data.teacherComment || null,
      },
    });

    revalidatePath("/teacher");
    revalidatePath("/teacher/results");
    revalidatePath("/student");
    revalidatePath("/student/results");

    return {
      success: true,
      message: `Result saved successfully. Final score: ${totalScore}% (${gradeDetails.grade}).`,
    };
  } catch (error) {
    console.error("Failed to save result:", error);
    return {
      success: false,
      message: "Failed to save result.",
    };
  }
}
